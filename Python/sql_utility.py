import mysql.connector
from mysql.connector import FieldType
from itertools import repeat
from queue import Queue
from time import time
import re


class Statement:
    '''
    Statement class to hold more useful values depending on the input/output
    '''

    def __init__(self, statement: str, values, message: str, table, fetch: bool, silent: bool):
        self.statement = statement
        self.values = values
        self.message = message
        self.fetch = fetch
        self.table = table
        self.silent = silent
        self.results = []

    def __repr__(self) -> str:
        return f'I contain:\n"{self.statement}"\n{self.values}'

    def __iter__(self):
        return iter((self.statement, self.values, self.message, self.fetch, self.table, self.silent))

    def set_results(self, values: dict):
        for val in values:
            self.results.append(val)


class Table:
    '''
    Python SQL Table class for statement functionality
    '''

    def __init__(self, database, name):
        self._name = name
        self._database = database
        self.columns = {}
        self.keys = {}
        self.__setup()

    def __repr__(self):
        statement = f'----\n~ {self._name} ~\n'
        statement += f'\nColumns: {self.__column_names()}'
        if self.keys:
            statement += f'\nLinks: {list(self.keys.keys())}'
        return statement

# ------ Inner Utility Functions ------
    def __setup(self):
        '''
        Connects to the database and creates the table.
        '''
        self.__add_query(
            f'CREATE TABLE IF NOT EXISTS {self._name} '
            f'({self._name}_id INT NOT NULL AUTO_INCREMENT, '
            f'PRIMARY KEY({self._name}_id))')
        print(f'Connected to {self._name}\n')
        self.__get_setup()

    @staticmethod
    def __value_check(columns, values):
        for val in values:
            # Check for missing data
            if len(columns) != len(val):
                print('A value is missing see below')
                print(f'-- Columns: {columns}')
                print(f'-- Values: {val}')
                return False
        return True

    def __fix_columns(self, value: tuple):
        # For use in linking columns
        if len(value) == 3:
            return (value[0].lower(), value[1].upper())
        # For use in adding columns
        return (f'{self._name}_{value[0].lower()}', value[1].upper())

    def __add_query(self, statement: str, values=None, message=None, fetch=False, silent=False):
        '''
        Internal function to process statement generation.
        Ensures lists of values are a tuple no matter the input type.
        '''
        if (values and type(values) is str) or (type(values) is list and len(values) == 1):
            values = tuple(values)
        s = Statement(statement, values, message, self, fetch, silent)
        self._database.queue.put(s)
        if fetch:
            return s.results

    def __column_names(self):
        '''
        Return the names of the columns
        '''
        return list(self.columns.keys())

    def __insert_statement(self, columns: list, values: tuple):
        '''
        Internal processor for inserting to allow for w/w_out ID more easily externally.
        '''
        if type(values[0]) is list:
            values = values[0]

        fixed_columns = ', '.join(columns)
        insert = (
            f'INSERT INTO {self._name} '
            f'({fixed_columns}) '
            f'VALUES ({', '.join(repeat('%s', len(columns)))})'
        )
        message = f'-- {len(values)} inserted into {self._name} successfully.'
        if self.__value_check(columns, values):
            self.__add_query(insert, values, message)

    def __rename_statement(self, change_from: str, change_to: str):
        '''
        Internal processor for renaming. 
        '''
        query = f'ALTER TABLE {self._name} '
        query += (f'RENAME COLUMN {change_from} TO {change_to}')
        message = f'Renamed to {change_to} successfully'
        self.__add_query(query, None, message)

    def __get_setup(self):
        '''
        Internal processor to capture foreign keys and columns
        '''
        self.__add_query(
            f'SELECT * FROM {self._name} LIMIT 1', fetch=True, silent=True)
        self.__add_query(f'SHOW CREATE TABLE '
                         f'{self._name}', fetch=True, silent=True)

# ------ External Utility Functions ------

    def show(self):
        '''
        Shortcut to show the table content.
        '''
        self.select()

    def show_columns(self):
        print(f'-- {self._name} table columns --')
        for k, v in self.columns.items():
            print(f'\n  Column: {k}'
                  f'\n  Type: {v}')

# ------ External Functions ------
    def insert_full(self, *values: tuple):
        '''
        Inserts values into the table, including ID.\n
        Values are tuples allowing multiple line entries at once\n
        Headers are populated automatically from the table\n
        Values can be a list, or a series of tuples
        '''
        columns = self.__column_names()
        self.__insert_statement(columns, values)

    def insert(self, *values: tuple):
        '''
        Inserts values into the table, without ID\n
        Values are tuples allowing multiple line entries at once\n
        Headers are populated automatically from the table\n
        Values can be a list, or a series of tuples
        '''
        columns = self.__column_names()[1:]
        self.__insert_statement(columns, values)

    def delete(self, where: str = None):
        '''
        Deletes rows matching the criteria.\n
        Leave empty to clear all data
        '''
        delete = (
            f'DELETE FROM {self._name} '
        )
        message = f'-- Rows in {self._name} deleted successfully'

        if where:
            delete += f'WHERE %s'
            self.__add_query(delete, where, message)
        else:
            self.__add_query(delete, None, message)
            self.__add_query(f'ALTER TABLE {self._name} AUTO_INCREMENT = 1')

    def update(self, update: str, criteria: str):
        '''
        Updates rows matching the criteria.
        '''
        update = (
            f'UPDATE {self._name} '
            f'SET %s '
            f'WHERE %s'
        )
        values = (update, criteria)
        message = f'-- {self._name} updated successfully'
        self.__add_query(update, values, message)

    def select(self, values: str = None, joins: tuple = None, where: str = None, group_by: str = None, order_by: str = None, limit: int = None):
        '''
        Selects and prints rows\n
        Works best with named parameters\n
        The default is all special modifiers are none.\n
        Joins are a tuple of join queries or Tables\n
        To join sub tables, send the sub table.join function to this parameter
        '''
        # Values
        if not values:
            values = '*'
        selection = f'SELECT {values} FROM {self._name} '

        # Join
        if joins:
            for val in joins:
                if type(val) == Table:
                    selection += self.join(val)
                else:
                    selection += val

        # Where
        if where:
            selection += f'WHERE {where} '

        # Group
        if group_by:
            selection += f'GROUP BY {group_by} '

        # Order
        if order_by:
            selection += f'ORDER BY {order_by} '

        if limit:
            selection += f'LIMIT {limit} '

        return self.__add_query(selection, fetch=True)

    def add_columns(self, *columns: tuple):
        '''
        Adds columns to the table as tuples\n
        (Column Name, Column Type)\n\n
        ** DO NOT include table name in column Name.**\n
        ** Table name is prepended automatically. **\n
        ** You should add foreign keys with the link_to() method**\n\n
        Example: (Name, VARCHAR(250) NOT NULL)\n
        '''
        message = f'Added columns to {self._name} successfully'
        for col in columns:
            column_name, column_type = self.__fix_columns(col)
            if column_name not in self.columns:
                add = (f'ALTER TABLE {self._name} ADD '
                       f'{column_name} {column_type}')
                self.columns[column_name] = column_type
                self.__add_query(add, None, message)
            else:
                print(f'{column_name} already exists in {self._name}\n')

    def rename_to(self, change_to: str):
        '''
        Change name of current table
        '''
        renamed_columns = []
        query = (f'ALTER TABLE {self._name} '
                 f'RENAME TO {change_to}')
        message = f'Renamed to {change_to} successfully'
        self.__add_query(query, message)
        for col in self.columns:
            a, b, column = col.partition(f'{self._name}_')
            if column:
                to = f'{change_to}_{column}'
                self.__rename_statement(col, to)
                renamed_columns.append((to, col))

        for to, was in renamed_columns:
            self.columns[to] = self.columns[was]
            del self.columns[was]

        self._name = change_to

    def rename(self, change_from: str, change_to: str):
        '''
        Put old column name in change_from, and new one in change_to.\n
        ** DO NOT include table name in either column Name.**\n
        ** Table name is prepended automatically. **\n
        '''
        change_from = f'{self._name}_{change_from}'
        change_to = f'{self._name}_{change_to}'
        if change_from in self.columns:
            self.__rename_statement(change_from, change_to)
            self.columns[change_to] = self.columns.pop(change_from)
        else:
            print(f'{change_from} is not in {self._name}\n')
            print('Please check the spelling')
            self.show_columns()

    def drop_columns(self, *columns: str):
        '''
        Drops columns from the table.\n
        Do not include table name.\n
        Use un-link method to remove a foreign key.
        '''
        drop = f'ALTER TABLE {self._name} DROP COLUMN %s'
        values = [tuple(f'{self._name}_{col}')
                  for col in columns if col in self.columns]
        message = f'Dropped {values} from {self._name} successfully'
        self.__add_query(drop, values, message)
        for val in values:
            del self.columns[val[0]]

    def link_to(self, *tables):
        '''
        Adds and links a foreign key to the provided Tables
        '''
        add_message = f'Added columns to {self._name} successfully'
        for table in tables:
            link_id = f'{table._name}_id'
            add = f'ALTER TABLE {self._name} ADD {link_id} INT NOT NULL'
            link = (f'ALTER TABLE {self._name} ADD FOREIGN KEY({link_id}) '
                    f'REFERENCES {table._name}({link_id})'
                    'ON DELETE CASCADE ON UPDATE CASCADE ')
            link_message = (f'{self._name} linked to '
                            f'{table._name} successfully')
            self.columns[link_id] = 'INT NOT NULL'
            self.__add_query(add, message=add_message)
            self.__add_query(link, message=link_message)

    def join(self, *tables):
        '''
        Supply tables as Tables\n
        An inner join is created where ID's match across tables.\n
        Returns a join query based on matches.
        '''

        '''
        Recommendation to join more effectively from GPT.... I don't think it's better?

        def join(self, *tables):
            joint = ''
            shared_columns = {col for table in tables for col in table.columns}
            for table in tables:
                shared = shared_columns.intersection(self.columns)
                if shared:
                    shared_column = next(iter(shared))
                    joint += (f'INNER JOIN {table._name} ON '
                            f'{self._name}.{shared_column} = {table._name}.{shared_column} ')
            return joint
        '''

        joint = ''
        for table in tables:
            if shared := tuple(set(table.columns).intersection(self.columns))[0]:
                joint += (f'INNER JOIN {table._name} ON '
                          f'{self._name}.{shared} = {table._name}.{shared} ')
        return joint

    def create_user(self, name: str, password: str):
        user = f'"{name}"@"localhost"'
        create = f'CREATE USER {user} IDENTIFIED BY "{password}"'
        privilege = f'GRANT ALL PRIVILEGES ON *.* TO {user}'
        self.__add_query(create)
        self.__add_query(privilege)


class MySQL_Database:
    '''
    Connect/Create a MySQL Database.
    '''

    def __init__(self, database: str, config: dict):
        self.tables = []
        self.queue = Queue()
        self._database = database
        self._config = config
        self.__setup()

    def __repr__(self) -> str:
        return f'{self._database} has tables: {self.tables}'

# ------ Inner Utility Functions ------
    def __setup(self):
        with self.__connect() as db:
            with db.cursor(dictionary=True) as cursor:
                try:
                    cursor.execute(f'CREATE DATABASE IF NOT EXISTS '
                                   f'{self._database}')
                    print('Created database')
                except:
                    print('Database already exists')
        self._config['database'] = self._database

    def __connect(self):
        '''
        Returns a connection to the database.
        '''

        '''
        TODO Experiment with a double return?
        return db, cursor
        this may keep the connection alive so it becomes
        with self.connct() as db, cursor:
        '''
        try:
            return mysql.connector.connect(**self._config)
        except mysql.connector.Error as err:
            print(err)

    @staticmethod
    def __print_results(results):
        '''
        Internal processor to print query results.
        '''
        for row in results:
            for key, value in row.items():
                print(f'{key}: {value}')
            print('\n')

    @staticmethod
    def __parse_SQL(results, table):
        '''
        Internal processor for get info
        '''
        # returns a dictionary where create table is the actual statement.
        results = results[0]['Create Table']
        # parent_foreign_keys = re.compile(r'(?:FOREIGN KEY \(`)(.*?)(?:`)')
        foreign_keys = re.compile(
            r'(?:REFERENCES `)(.*?)(?:` \(`)(.*?)(?:`)')
        if links := foreign_keys.findall(results):
            table.keys = {k: v for k, v in links}

# ------ External Utility Functions ------
    def table(self, name: str):
        '''
        Use to create/define Table objects\n
        Primare key is automatically created based on table name
        '''
        new_table = Table(self, name)
        self.execute()
        self.tables.append(new_table)
        return new_table

    def execute(self):
        '''
        Process items in self.queue
        '''
        with self.__connect() as db:
            with db.cursor(dictionary=True) as cursor:
                start_time = time()
                count = 0
                while not self.queue.empty():
                    task = self.queue.get()
                    statement, values, message, fetch, table, silent = task
                    try:
                        if values:
                            cursor.executemany(statement, values)
                        else:
                            cursor.execute(statement)
                        if fetch:
                            data = cursor.fetchall()
                            task.set_results(data)
                            if 'SHOW CREATE TABLE' in statement:
                                self.__parse_SQL(data, table)
                            elif 'LIMIT 1' in statement:
                                table.columns = {
                                    col[0]: FieldType.get_info(col[1]) for col in cursor.description}
                            else:
                                self.__print_results(data)
                        if not silent:
                            count += 1
                    except Exception as err:
                        if message:
                            print(f'{statement} was not executed')
                    # print(cursor.statement)
                end_time = time()
                if count:
                    print(f'Executed {count} statements successfully in '
                          f'{end_time-start_time}')

    def show_all(self):
        '''
        Displays all active tables in database.
        '''
        for table in self.tables:
            print(table)
