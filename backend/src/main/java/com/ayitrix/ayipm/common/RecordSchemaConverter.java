package com.ayitrix.ayipm.common;

import java.lang.reflect.RecordComponent;
import java.util.Iterator;
import java.util.List;

import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JavaType;

import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverter;
import io.swagger.v3.core.converter.ModelConverterContext;
import io.swagger.v3.core.util.Json;
import io.swagger.v3.oas.models.media.JsonSchema;
import io.swagger.v3.oas.models.media.Schema;

/**
 * Says in the OpenAPI spec which fields of each record the backend always sends, so the TypeScript types generated
 * from it match the JSON:
 * <ul>
 * <li>a field is required unless it is {@link Nullable};</li>
 * <li>a {@code @Nullable} field of a {@code @JsonInclude(NON_NULL)} record is left out when it is null, so it is
 * optional;</li>
 * <li>a {@code @Nullable} field of any other record is sent as {@code null}, so it is required and may be null.</li>
 * </ul>
 * {@code ApiResponse<Void>} has {@code "data": null}. Request bodies don't keep the required fields; see
 * {@link OpenApiConfig}.
 */
@Component
class RecordSchemaConverter implements ModelConverter {

	@Override
	public Schema<?> resolve(AnnotatedType type, ModelConverterContext context, Iterator<ModelConverter> chain) {
		if (!chain.hasNext()) return null;
		JavaType javaType = Json.mapper().constructType(type.getType());
		if (javaType.getRawClass() == Void.class) return new JsonSchema().typesItem("null");
		Schema<?> schema = chain.next().resolve(type, context, chain);
		if (schema != null && javaType.isRecordType()) {
			// A record that was already resolved comes back as a $ref to its definition.
			Schema<?> model = schema.get$ref() == null ? schema : context.getDefinedModels().get(refName(schema));
			if (model != null && model.getProperties() != null) describeFields(javaType.getRawClass(), model);
		}
		return schema;
	}

	private static void describeFields(Class<?> record, Schema<?> model) {
		JsonInclude include = record.getAnnotation(JsonInclude.class);
		boolean leavesOutNulls = include != null && include.value() == JsonInclude.Include.NON_NULL;
		for (RecordComponent component : record.getRecordComponents()) {
			String name = component.getName();
			Schema<?> property = model.getProperties().get(name);
			if (property == null) continue;
			boolean nullable = component.getAnnotatedType().isAnnotationPresent(Nullable.class);
			if (nullable && leavesOutNulls) continue;
			if (nullable && !acceptsNull(property)) model.getProperties().put(name, orNull(property));
			if (model.getRequired() == null || !model.getRequired().contains(name)) model.addRequiredItem(name);
		}
	}

	private static Schema<?> orNull(Schema<?> property) {
		if (property.get$ref() != null) return new JsonSchema().oneOf(List.of(property, new JsonSchema().typesItem("null")));
		if (property.getTypes() == null && property.getType() != null) property.addType(property.getType());
		property.addType("null");
		return property;
	}

	private static boolean acceptsNull(Schema<?> property) {
		return property.getOneOf() != null || property.getTypes() != null && property.getTypes().contains("null");
	}

	private static String refName(Schema<?> schema) {
		return schema.get$ref().substring(schema.get$ref().lastIndexOf('/') + 1);
	}

}
