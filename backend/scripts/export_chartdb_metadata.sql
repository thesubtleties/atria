/* PostgreSQL edition - ChartDB metadata export */
WITH fk_info AS (
SELECT array_to_string(array_agg(CONCAT('{"schema":"', replace(schema_name, '"', ''), '"',
',"table":"', replace(table_name::text, '"', ''), '"',
',"column":"', replace(fk_column::text, '"', ''), '"',
',"foreign_key_name":"', foreign_key_name, '"',
',"reference_schema":"', COALESCE(reference_schema, 'public'), '"',
',"reference_table":"', reference_table, '"',
',"reference_column":"', reference_column, '"',
',"fk_def":"', replace(fk_def, '"', ''),
'"}')), ',') as fk_metadata
FROM (
SELECT c.conname AS foreign_key_name,
n.nspname AS schema_name,
CASE
WHEN position('.' in conrelid::regclass::text) > 0
THEN split_part(conrelid::regclass::text, '.', 2)
ELSE conrelid::regclass::text
END AS table_name,
a.attname AS fk_column,
nr.nspname AS reference_schema,
CASE
WHEN position('.' in confrelid::regclass::text) > 0
THEN split_part(confrelid::regclass::text, '.', 2)
ELSE confrelid::regclass::text
END AS reference_table,
af.attname AS reference_column,
pg_get_constraintdef(c.oid) as fk_def
FROM
pg_constraint AS c
JOIN
pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN
pg_class AS cl ON cl.oid = c.conrelid
JOIN
pg_namespace AS n ON n.oid = cl.relnamespace
JOIN
pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
JOIN
pg_class AS clf ON clf.oid = c.confrelid
JOIN
pg_namespace AS nr ON nr.oid = clf.relnamespace
WHERE
c.contype = 'f'
AND connamespace::regnamespace::text NOT IN ('information_schema', 'pg_catalog')
) AS x
), pk_info AS (
SELECT array_to_string(array_agg(CONCAT('{"schema":"', replace(schema_name, '"', ''), '"',
',"table":"', replace(pk_table, '"', ''), '"',
',"column":"', replace(pk_column, '"', ''), '"',
',"pk_def":"', replace(pk_def, '"', ''),
'"}')), ',') AS pk_metadata
FROM (
SELECT connamespace::regnamespace::text AS schema_name,
CASE
WHEN strpos(conrelid::regclass::text, '.') > 0
THEN split_part(conrelid::regclass::text, '.', 2)
ELSE conrelid::regclass::text
END AS pk_table,
unnest(string_to_array(substring(pg_get_constraintdef(oid) FROM '\((.*?)\)'), ',')) AS pk_column,
pg_get_constraintdef(oid) as pk_def
FROM
pg_constraint
WHERE
contype = 'p'
AND connamespace::regnamespace::text NOT IN ('information_schema', 'pg_catalog')
) AS y
),
indexes_cols AS (
SELECT  tnsp.nspname                                                                AS schema_name,
trel.relname                                                                    AS table_name,
pg_relation_size('"' || tnsp.nspname || '".' || '"' || irel.relname || '"') AS index_size,
irel.relname                                                                AS index_name,
am.amname                                                                   AS index_type,
a.attname                                                                   AS col_name,
(CASE WHEN i.indisunique = TRUE THEN 'true' ELSE 'false' END)               AS is_unique,
irel.reltuples                                                              AS cardinality,
1 + Array_position(i.indkey, a.attnum)                                      AS column_position,
CASE o.OPTION & 1 WHEN 1 THEN 'DESC' ELSE 'ASC' END                         AS direction
FROM pg_index AS i
JOIN pg_class AS trel ON trel.oid = i.indrelid
JOIN pg_namespace AS tnsp ON trel.relnamespace = tnsp.oid
JOIN pg_class AS irel ON irel.oid = i.indexrelid
JOIN pg_am AS am ON irel.relam = am.oid
CROSS JOIN LATERAL unnest (i.indkey)
WITH ORDINALITY AS c (colnum, ordinality) LEFT JOIN LATERAL unnest (i.indoption)
WITH ORDINALITY AS o (option, ordinality)
ON c.ordinality = o.ordinality JOIN pg_attribute AS a ON trel.oid = a.attrelid AND a.attnum = c.colnum
WHERE tnsp.nspname NOT LIKE 'pg_%'
GROUP BY tnsp.nspname, trel.relname, irel.relname, am.amname, i.indisunique, i.indexrelid, irel.reltuples, a.attname, Array_position(i.indkey, a.attnum), o.OPTION, i.indpred
),
cols AS (
SELECT array_to_string(array_agg(CONCAT('{"schema":"', cols.table_schema,
'","table":"', cols.table_name,
'","name":"', cols.column_name,
'","ordinal_position":', cols.ordinal_position,
',"type":"', case when LOWER(replace(cols.data_type, '"', '')) = 'user-defined' then pg_type.typname else LOWER(replace(cols.data_type, '"', '')) end,
'","character_maximum_length":"', COALESCE(cols.character_maximum_length::text, 'null'),
'","precision":',
CASE
WHEN cols.data_type = 'numeric' OR cols.data_type = 'decimal'
THEN CONCAT('{"precision":', COALESCE(cols.numeric_precision::text, 'null'),
',"scale":', COALESCE(cols.numeric_scale::text, 'null'), '}')
ELSE 'null'
END,
',"nullable":', CASE WHEN (cols.IS_NULLABLE = 'YES') THEN 'true' ELSE 'false' END,
',"default":"', null,
'","collation":"', COALESCE(cols.COLLATION_NAME, ''),
'","comment":"', null,
'"}')), ',') AS cols_metadata
FROM information_schema.columns cols
LEFT JOIN pg_catalog.pg_class c
ON c.relname = cols.table_name
JOIN pg_catalog.pg_namespace n
ON n.oid = c.relnamespace AND n.nspname = cols.table_schema
LEFT JOIN pg_catalog.pg_description dsc
ON dsc.objoid = c.oid AND dsc.objsubid = cols.ordinal_position
LEFT JOIN pg_catalog.pg_attribute attr
ON attr.attrelid = c.oid AND attr.attname = cols.column_name
LEFT JOIN pg_catalog.pg_type
ON pg_type.oid = attr.atttypid
WHERE cols.table_schema NOT IN ('information_schema', 'pg_catalog')
), indexes_metadata AS (
SELECT array_to_string(array_agg(CONCAT('{"schema":"', schema_name,
'","table":"', table_name,
'","name":"', index_name,
'","column":"', replace(col_name :: TEXT, '"', E'"'),
'","index_type":"', index_type,
'","cardinality":', cardinality,
',"size":', index_size,
',"unique":', is_unique,
',"column_position":', column_position,
',"direction":"', LOWER(direction),
'"}')), ',') AS indexes_metadata
FROM indexes_cols x 
), tbls AS (
SELECT array_to_string(array_agg(CONCAT('{',
'"schema":"', tbls.TABLE_SCHEMA, '",',
'"table":"', tbls.TABLE_NAME, '",',
'"rows":', COALESCE((SELECT s.n_live_tup
FROM pg_stat_user_tables s
WHERE tbls.TABLE_SCHEMA = s.schemaname AND tbls.TABLE_NAME = s.relname),
0), ', "type":"', tbls.TABLE_TYPE, '",', '"engine":"",', '"collation":"",',
'"comment":"', null,
'"}'
)),
',') AS tbls_metadata
FROM information_schema.tables tbls
LEFT JOIN pg_catalog.pg_class c ON c.relname = tbls.TABLE_NAME
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
AND n.nspname = tbls.TABLE_SCHEMA
LEFT JOIN pg_catalog.pg_description dsc ON dsc.objoid = c.oid
AND dsc.objsubid = 0
WHERE tbls.TABLE_SCHEMA NOT IN ('information_schema', 'pg_catalog') 
), config AS (
SELECT array_to_string(
array_agg(CONCAT('{"name":"', conf.name, '","value":"', replace(conf.setting, '"', E'"'), '"}')),
',') AS config_metadata
FROM pg_settings conf
), views AS (
SELECT array_to_string(array_agg(CONCAT('{"schema":"', views.schemaname,
'","view_name":"', viewname,
'","view_definition":""}')),
',') AS views_metadata
FROM pg_views views
WHERE views.schemaname NOT IN ('information_schema', 'pg_catalog') 
), custom_types AS (
SELECT array_to_string(array_agg(type_json), ',') AS custom_types_metadata
FROM (
-- ENUM types
SELECT CONCAT(
'{"schema":"', n.nspname,
'","type":"', t.typname,
'","kind":"enum"',
',"values":[', string_agg('"' || e.enumlabel || '"', ',' ORDER BY e.enumsortorder), ']}'
) AS type_json
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') 
GROUP BY n.nspname, t.typname

UNION ALL

-- COMPOSITE types
SELECT CONCAT(
'{"schema":"', schema_name,
'","type":"', type_name,
'","kind":"composite"',
',"fields":[', fields_json, ']}'
) AS type_json
FROM (
SELECT
n.nspname AS schema_name,
t.typname AS type_name,
string_agg(
CONCAT('{"field":"', a.attname, '","type":"', format_type(a.atttypid, a.atttypmod), '"}'),
',' ORDER BY a.attnum
) AS fields_json
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_class c ON c.oid = t.typrelid
JOIN pg_attribute a ON a.attrelid = c.oid
WHERE t.typtype = 'c'
AND c.relkind = 'c'  -- ✅ Only user-defined composite types
AND a.attnum > 0 AND NOT a.attisdropped
AND n.nspname NOT IN ('pg_catalog', 'information_schema') 
GROUP BY n.nspname, t.typname
) AS comp
) AS all_types
)
SELECT CONCAT('{    "fk_info": [', COALESCE(fk_metadata, ''),
'], "pk_info": [', COALESCE(pk_metadata, ''),
'], "columns": [', COALESCE(cols_metadata, ''),
'], "indexes": [', COALESCE(indexes_metadata, ''),
'], "tables":[', COALESCE(tbls_metadata, ''),
'], "views":[', COALESCE(views_metadata, ''),
'], "custom_types": [', COALESCE(custom_types_metadata, ''),
'], "database_name": "', CURRENT_DATABASE(), '', '", "version": "', '',
'"}') AS metadata_json_to_import
FROM fk_info, pk_info, cols, indexes_metadata, tbls, config, views, custom_types;