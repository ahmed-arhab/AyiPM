package com.ayitrix.ayipm.task;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ayitrix.ayipm.activity.ActivityService;
import com.ayitrix.ayipm.auth.Permission;
import com.ayitrix.ayipm.common.ApiException;
import com.ayitrix.ayipm.common.ApiValue;
import com.ayitrix.ayipm.common.Dates;
import com.ayitrix.ayipm.common.Text;
import com.ayitrix.ayipm.employee.User;
import com.ayitrix.ayipm.employee.UserRepository;
import com.ayitrix.ayipm.notification.NotificationMessage;
import com.ayitrix.ayipm.notification.NotificationService;
import com.ayitrix.ayipm.project.ProjectRepository;
import com.ayitrix.ayipm.project.ProjectService;

/**
 * The rules match what src/store/actions/tasks.ts enforced in the browser: people with {@code tasks.manage} can
 * change anything, and an assignee can only move their own tasks between columns.
 */
@Service
public class TaskService {

	private final TaskRepository tasks;
	private final TaskCommentRepository comments;
	private final TaskHistoryRepository history;
	private final ProjectRepository projectRepository;
	private final ProjectService projects;
	private final UserRepository users;
	private final ActivityService activity;
	private final NotificationService notifications;

	public TaskService(TaskRepository tasks, TaskCommentRepository comments, TaskHistoryRepository history, ProjectRepository projectRepository,
			ProjectService projects, UserRepository users, ActivityService activity, NotificationService notifications) {
		this.tasks = tasks;
		this.comments = comments;
		this.history = history;
		this.projectRepository = projectRepository;
		this.projects = projects;
		this.users = users;
		this.activity = activity;
		this.notifications = notifications;
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> list(UUID projectId) {
		return toResponses(projectId == null ? tasks.findAllByOrderByStatusAscPositionAsc() : tasks.findByProjectIdOrderByStatusAscPositionAsc(projectId));
	}

	@Transactional
	public TaskResponse create(User actor, TaskRequest input) {
		Task task = new Task(actor.getId());
		task.setTitle(requireTitle(input.title()));
		task.setDescription(Text.trim(input.description()));
		task.setProjectId(requireProject(input.projectId()));
		task.setDueDate(Dates.parse(input.dueDate(), "Due date is required."));
		task.setPriority(parse(TaskPriority.class, input.priority(), "Choose a valid priority."));
		TaskStatus status = parse(TaskStatus.class, input.status(), "Choose a valid status.");
		task.setPosition(endOfColumn(status));
		task.setStatus(status);
		task.setAssigneeId(parseAssignee(input.assigneeId()));
		tasks.saveAndFlush(task);

		history.save(new TaskHistoryEntry(task.getId(), actor.getId(), "Created task"));
		if (task.getAssigneeId() != null) projects.ensureMember(task.getProjectId(), task.getAssigneeId());
		activity.record(actor, "Created Task", ActivityService.TASK, task.getId(), task.getTitle());
		notifyAssignee(task, actor);
		return toResponse(task);
	}

	@Transactional
	public TaskResponse update(User actor, UUID id, TaskRequest update) {
		Task task = find(id);
		if (!canManage(actor) && (!actor.getId().equals(task.getAssigneeId()) || !update.onlyChangesStatus())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "You can only change the status of tasks assigned to you.");
		}

		// Wording matches describeChanges in the browser, so old and new history entries read the same.
		List<String> changes = new ArrayList<>();
		if (update.title() != null) {
			String title = requireTitle(update.title());
			if (!title.equals(task.getTitle())) changes.add("Renamed task");
			task.setTitle(title);
		}
		if (update.description() != null && !update.description().trim().equals(task.getDescription())) {
			task.setDescription(update.description().trim());
			changes.add("Updated description");
		}
		TaskStatus previousStatus = task.getStatus();
		if (update.status() != null) {
			TaskStatus status = parse(TaskStatus.class, update.status(), "Choose a valid status.");
			if (status != previousStatus) {
				task.setPosition(endOfColumn(status));
				task.setStatus(status);
				changes.add("Moved to " + status.label());
			}
		}
		if (update.priority() != null) {
			TaskPriority priority = parse(TaskPriority.class, update.priority(), "Choose a valid priority.");
			if (priority != task.getPriority()) changes.add("Priority set to " + priority.label());
			task.setPriority(priority);
		}
		if (update.dueDate() != null) {
			LocalDate due = Dates.parse(update.dueDate(), "Due date is required.");
			if (!due.equals(task.getDueDate())) changes.add("Due date set to " + due);
			task.setDueDate(due);
		}
		if (update.projectId() != null) {
			UUID projectId = requireProject(update.projectId());
			if (!projectId.equals(task.getProjectId())) changes.add("Moved to project " + projects.get(projectId).getName());
			task.setProjectId(projectId);
		}
		UUID previousAssignee = task.getAssigneeId();
		if (update.assigneeId() != null) {
			UUID assignee = parseAssignee(update.assigneeId());
			if (!Objects.equals(assignee, previousAssignee)) {
				changes.add(assignee == null ? "Unassigned" : "Assigned to " + users.findById(assignee).orElseThrow().getName());
			}
			task.setAssigneeId(assignee);
		}
		if (changes.isEmpty()) return toResponse(task);

		tasks.saveAndFlush(task);
		for (String change : changes) history.save(new TaskHistoryEntry(id, actor.getId(), change));
		if (task.getAssigneeId() != null) projects.ensureMember(task.getProjectId(), task.getAssigneeId());
		activity.record(actor, "Updated Task", ActivityService.TASK, id, task.getTitle(), String.join(" · ", changes));
		if (!Objects.equals(task.getAssigneeId(), previousAssignee)) notifyAssignee(task, actor);
		if (task.getStatus() != previousStatus && !task.getCreatedById().equals(actor.getId())) {
			notifications.notify(List.of(task.getCreatedById()), new NotificationMessage("Task status updated",
					actor.getName() + " moved \"" + task.getTitle() + "\" to " + task.getStatus().label() + ".", "task", "low", link(task), actor.getId()));
		}
		return toResponse(task);
	}

	/**
	 * Moves a task to a column and, if {@code index} is given, to that position within it. Returns every task in the
	 * target column, because their positions may have changed.
	 */
	@Transactional
	public List<TaskResponse> move(User actor, UUID id, String statusValue, Integer index) {
		Task task = find(id);
		if (!canManage(actor) && !actor.getId().equals(task.getAssigneeId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "You can only move tasks assigned to you.");
		}
		TaskStatus status = parse(TaskStatus.class, statusValue, "Choose a valid status.");
		if (status != task.getStatus()) update(actor, id, new TaskRequest(null, null, null, null, null, statusValue, null));

		List<Task> column = new ArrayList<>(tasks.lockColumn(status));
		if (index != null) {
			column.removeIf(t -> t.getId().equals(id));
			column.add(Math.max(0, Math.min(index, column.size())), task);
			for (int i = 0; i < column.size(); i++) column.get(i).setPosition(i);
		}
		return toResponses(column);
	}

	@Transactional
	public void delete(User actor, UUID id) {
		Task task = find(id);
		tasks.delete(task);
		activity.record(actor, "Deleted Task", ActivityService.TASK, id, task.getTitle());
	}

	@Transactional
	public TaskResponse addComment(User actor, UUID id, String text) {
		String body = Text.trim(text);
		if (body.isEmpty()) throw ApiException.badRequest("Comment cannot be empty.");
		Task task = find(id);
		comments.saveAndFlush(new TaskComment(id, actor.getId(), body));
		List<UUID> recipients = Stream.of(task.getAssigneeId(), task.getCreatedById()).filter(Objects::nonNull).toList();
		notifications.notify(recipients, new NotificationMessage("New comment", actor.getName() + " commented on \"" + task.getTitle() + "\".",
				"task", "low", link(task), actor.getId()));
		return toResponse(task);
	}

	private Task find(UUID id) {
		return tasks.findById(id).orElseThrow(() -> ApiException.notFound("Task not found."));
	}

	private static boolean canManage(User user) {
		return user.getRole().has(Permission.TASKS_MANAGE);
	}

	/** The next free position at the end of a column, read under the column lock. */
	private int endOfColumn(TaskStatus status) {
		return tasks.lockColumn(status).stream().mapToInt(Task::getPosition).max().orElse(-1) + 1;
	}

	private void notifyAssignee(Task task, User actor) {
		if (task.getAssigneeId() == null || task.getAssigneeId().equals(actor.getId())) return;
		notifications.notify(List.of(task.getAssigneeId()), new NotificationMessage("Task assigned to you",
				actor.getName() + " assigned you \"" + task.getTitle() + "\".", "task", task.getPriority().notificationPriority(), link(task), actor.getId()));
	}

	private static String link(Task task) {
		return "/tasks?task=" + task.getId();
	}

	private static String requireTitle(String value) {
		String title = Text.trim(value);
		if (title.isEmpty()) throw ApiException.badRequest("Task title is required.");
		return title;
	}

	private UUID requireProject(String value) {
		UUID id = parseId(value);
		if (id == null || !projectRepository.existsById(id)) throw ApiException.badRequest("Select a valid project.");
		return id;
	}

	private UUID parseAssignee(String value) {
		if (value == null || value.isBlank()) return null;
		UUID id = parseId(value);
		if (id == null || users.findById(id).filter(User::isActive).isEmpty()) throw ApiException.badRequest("Select an active assignee.");
		return id;
	}

	private static UUID parseId(String value) {
		try {
			return value == null ? null : UUID.fromString(value);
		} catch (IllegalArgumentException e) {
			return null;
		}
	}

	private static <E extends Enum<E> & ApiValue> E parse(Class<E> type, String value, String message) {
		return ApiValue.parse(type, value).orElseThrow(() -> ApiException.badRequest(message));
	}

	private TaskResponse toResponse(Task task) {
		return toResponses(List.of(task)).get(0);
	}

	// Loads comments and history for all tasks in two queries instead of two per task.
	private List<TaskResponse> toResponses(List<Task> found) {
		List<UUID> ids = found.stream().map(Task::getId).toList();
		Map<UUID, List<TaskResponse.Comment>> commentsByTask = comments.findByTaskIdInOrderByCreatedAtAsc(ids).stream()
				.collect(Collectors.groupingBy(TaskComment::getTaskId, Collectors.mapping(TaskResponse.Comment::from, Collectors.toList())));
		Map<UUID, List<TaskResponse.HistoryEntry>> historyByTask = history.findByTaskIdInOrderByCreatedAtAsc(ids).stream()
				.collect(Collectors.groupingBy(TaskHistoryEntry::getTaskId, Collectors.mapping(TaskResponse.HistoryEntry::from, Collectors.toList())));
		return found.stream()
				.map(t -> TaskResponse.from(t, commentsByTask.getOrDefault(t.getId(), List.of()), historyByTask.getOrDefault(t.getId(), List.of())))
				.toList();
	}

}
