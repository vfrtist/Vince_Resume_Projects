from sql_utility import MySQL_Database

PASSWORD = '<enter password here>'
CONFIG = {
    "user": "root",
    "password": PASSWORD,
    "host": "127.0.0.1",
    "raise_on_warnings": True,
    "autocommit": True
}

'''
Initial setup creating database and tables.
'''
example = MySQL_Database('demo', CONFIG)
people = example.table('people')
jobs = example.table('jobs')
companies = example.table('companies')

'''
Add all columns and create foreign key links
'''

people.add_columns(('first_name', 'VARCHAR(50)'),
                   ('last_name', 'VARCHAR(50)'),
                   ('date_of_birth', 'DATE'))

jobs.add_columns(('job_title', 'VARCHAR(100)'),
                 ('salary', 'DECIMAL(9,2)'))

companies.add_columns(('name', 'VARCHAR(100)'),
                      ('address', 'TEXT'))

jobs.link_to(companies)
people.link_to(jobs)

'''
Create company, job, and people.
These can be inserted both individually or as a list for flexibility.
This is demonstrated below.
'''

companies.insert(('Big Entertainment', '235 Oakwood Lane, Springfield, IL 62701'),
                 ('Movie Startup', '742 Elm Street, Brookhaven, NY 11719'))

jobs.insert(('Executive', 125000, 1),
            ('Graphic Designer', 65000, 1),
            ('Secretary', 75000, 1),
            ('Director', 100000, 2),
            ('Consultant', 50000, 2),
            ('Producer', 85500, 2))

friends = [('Emma', 'Johnson', '1993-04-15', 1),
           ('James', 'Smith', '1987-10-21', 1),
           ('Olivia', 'Brown', '1992-02-05', 2),
           ('Liam', 'Davis', '1985-07-13', 2),
           ('Ava', 'Wilson', '2000-08-30', 3),
           ('Noah', 'Taylor', '1990-11-09', 3),
           ('Isabella', 'Anderson', '1983-12-25', 4),
           ('Mason', 'Martinez', '1995-01-22', 5),
           ('Sophia', 'Thomas', '1997-03-16', 5),
           ('Ethan', 'Moore', '1988-06-11', 6)]

people.insert(friends)


'''
Selections are organized by keys, making them easier to compose
'''
people.select(values=('people_first_name as "First Name", people_last_name as "Last Name",'
                      'jobs_job_title as "Job", jobs_salary as "Salary",'
                      'companies_name as "Company"'),
              joins=(jobs, jobs.join(companies)))

companies.select(values='companies_name as "Company", people_first_name as "First Name", jobs_salary as "Salary"',
                 joins=(jobs, jobs.join(people)),
                 order_by='companies_name, jobs_salary DESC')

'''
Some secondary functionalities:
    Change an entire table with a simple task
    Display the columns and types
'''
people.rename_to('employees')
people.show_columns()

# Execute all written tasks which happens as a singular queue
example.execute()
