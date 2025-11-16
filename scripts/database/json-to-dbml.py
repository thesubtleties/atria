#!/usr/bin/env python3
"""
Convert PostgreSQL schema JSON to DBML format for ChartDB visualization.
"""
import json
import sys
from collections import defaultdict


def convert_pg_type_to_dbml(pg_type, char_max_len=None, precision=None):
    """Convert PostgreSQL types to DBML-friendly types."""
    type_mapping = {
        'integer': 'integer',
        'bigint': 'bigint',
        'smallint': 'smallint',
        'character varying': 'varchar',
        'text': 'text',
        'boolean': 'boolean',
        'timestamp without time zone': 'timestamp',
        'timestamp with time zone': 'timestamptz',
        'date': 'date',
        'time without time zone': 'time',
        'json': 'json',
        'jsonb': 'jsonb',
        'uuid': 'uuid',
        'numeric': 'decimal',
        'real': 'real',
        'double precision': 'double',
        'bytea': 'bytea',
        'array': 'array',
        'user-defined': 'varchar',  # PostgreSQL ENUMs show as user-defined
    }

    base_type = type_mapping.get(pg_type, pg_type)

    # If still not mapped, default to varchar for safety
    if base_type == pg_type and pg_type not in ['integer', 'bigint', 'text', 'boolean']:
        base_type = 'varchar'

    # Add length for varchar
    if base_type == 'varchar' and char_max_len and char_max_len != 'null':
        return f'varchar({char_max_len})'

    # Add precision for decimal/numeric
    if base_type == 'decimal' and precision and precision != 'null':
        try:
            prec_obj = json.loads(precision) if isinstance(precision, str) else precision
            if isinstance(prec_obj, dict) and prec_obj.get('precision'):
                p = prec_obj['precision']
                s = prec_obj.get('scale', 0)
                return f'decimal({p},{s})'
        except:
            pass

    return base_type


def generate_dbml(schema_data):
    """Generate DBML from schema JSON."""

    # Build a map of tables -> columns
    tables_cols = defaultdict(list)
    for col in schema_data.get('columns', []):
        table = col['table']
        tables_cols[table].append(col)

    # Build primary key map
    pk_map = defaultdict(list)
    for pk in schema_data.get('pk_info', []):
        table = pk['table']
        column = pk['column'].strip()
        pk_map[table].append(column)

    # Build index map
    indexes_map = defaultdict(list)
    for idx in schema_data.get('indexes', []):
        table = idx['table']
        indexes_map[table].append(idx)

    dbml_output = []
    dbml_output.append("// Atria Database Schema")
    dbml_output.append(f"// Database: {schema_data.get('database_name', 'unknown')}")
    dbml_output.append("// Generated from PostgreSQL schema export\n")

    # Generate table definitions
    for table_info in schema_data.get('tables', []):
        table_name = table_info['table']
        table_comment = table_info.get('comment', '').replace('"', '\\"')

        # Skip alembic version table
        if table_name == 'alembic_version':
            continue

        dbml_output.append(f"Table {table_name} {{")

        # Get columns for this table, sorted by ordinal position
        cols = sorted(tables_cols.get(table_name, []), key=lambda x: int(x['ordinal_position']))

        for col in cols:
            col_name = col['name']
            col_type = convert_pg_type_to_dbml(
                col['type'],
                col.get('character_maximum_length'),
                col.get('precision')
            )

            # Build column attributes
            attrs = []

            # Primary key
            if col_name in pk_map.get(table_name, []):
                attrs.append('primary key')

            # Not null
            if not col.get('nullable', True):
                attrs.append('not null')

            # Default value
            if col.get('default') and col['default'].strip():
                default_val = col['default']
                # Clean up common defaults
                if 'nextval' in default_val:
                    attrs.append('increment')
                elif default_val not in ['', 'NULL']:
                    # Simplify default display
                    if '::' in default_val:
                        default_val = default_val.split('::')[0]

                    # Format based on value type
                    if default_val.upper() in ['CURRENT_TIMESTAMP', 'NOW()', 'CURRENT_DATE', 'CURRENT_TIME']:
                        # Function expressions need backticks
                        attrs.append(f'default: `{default_val.upper()}`')
                    elif default_val.lower() in ['true', 'false']:
                        # Booleans as-is
                        attrs.append(f'default: {default_val.lower()}')
                    elif default_val.replace('.', '').replace('-', '').isdigit():
                        # Numeric values as-is
                        attrs.append(f'default: {default_val}')
                    else:
                        # String literals need quotes
                        # Remove surrounding quotes if they exist
                        clean_val = default_val.strip("'\"")
                        attrs.append(f"default: '{clean_val}'")

            # Format the column line
            attr_str = f" [{', '.join(attrs)}]" if attrs else ""

            # Add comment if exists
            comment = col.get('comment', '').replace('"', '\\"')
            note_str = f" Note: '{comment}'" if comment else ""

            dbml_output.append(f"  {col_name} {col_type}{attr_str}{note_str}")

        # Add indexes inside the table
        table_indexes = indexes_map.get(table_name, [])
        if table_indexes:
            # Group indexes by index name
            index_groups = defaultdict(list)
            for idx in table_indexes:
                index_groups[idx['name']].append(idx)

            # Filter out primary key indexes
            non_pk_indexes = {
                name: cols for name, cols in index_groups.items()
                if not name.endswith('_pkey')
            }

            if non_pk_indexes:
                dbml_output.append("\n  indexes {")
                for idx_name, idx_cols in non_pk_indexes.items():
                    # Build column list in order
                    sorted_cols = sorted(idx_cols, key=lambda x: x['column_position'])
                    col_names = [c['column'] for c in sorted_cols]

                    # Determine index type
                    is_unique = sorted_cols[0].get('unique') == 'true'

                    col_str = ', '.join(col_names)
                    if len(col_names) > 1:
                        # Composite index
                        type_str = f" [unique]" if is_unique else ""
                        dbml_output.append(f"    ({col_str}){type_str}")
                    else:
                        # Single column index
                        type_str = f" [unique]" if is_unique else ""
                        dbml_output.append(f"    {col_str}{type_str}")

                dbml_output.append("  }")

        # Add table note if comment exists
        if table_comment:
            dbml_output.append(f"\n  Note: '{table_comment}'")

        dbml_output.append("}\n")

    # Generate foreign key relationships
    dbml_output.append("\n// Foreign Key Relationships")
    for fk in schema_data.get('fk_info', []):
        from_table = fk['table']
        from_col = fk['column']
        to_table = fk['reference_table']
        to_col = fk['reference_column']

        # Determine relationship type (many-to-one is most common)
        # In DBML: > means many-to-one, < means one-to-many, - means one-to-one
        rel_type = '>'  # Default to many-to-one

        dbml_output.append(f"Ref: {from_table}.{from_col} {rel_type} {to_table}.{to_col}")

    return '\n'.join(dbml_output)


def main():
    input_file = 'database-schema.json'
    output_file = 'database-schema.dbml'

    # Allow command line args
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]

    # Read JSON schema
    print(f"Reading schema from {input_file}...")
    with open(input_file, 'r') as f:
        schema_data = json.load(f)

    # Generate DBML
    print("Converting to DBML format...")
    dbml_content = generate_dbml(schema_data)

    # Write output
    print(f"Writing DBML to {output_file}...")
    with open(output_file, 'w') as f:
        f.write(dbml_content)

    print(f"✅ Successfully converted schema to DBML!")
    print(f"   Tables: {len(schema_data.get('tables', []))}")
    print(f"   Foreign Keys: {len(schema_data.get('fk_info', []))}")
    print(f"\nYou can now import {output_file} into ChartDB or dbdiagram.io")


if __name__ == '__main__':
    main()
