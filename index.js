const mysql = require('mysql');
const inquirer = require('inquirer');
const password = require('./password')


// prevent same id being used again, integrate managers (update and view by manager), deleting 

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: password.toString(),
    database: 'employees_db'
});

let departmentList = [];
let roleList = [];
let empList = [];

connection.connect((err) => {
    if (err) throw err;
    console.log("connected at " +connection.threadId+"/n");
    searchDatabase();
});

function searchDatabase () {
    inquirer.prompt({
        name: 'action',
        type: 'list',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'Add department',
            'View all roles',
            'Add role',
            'View all employees',
            'Add employee',
            'Update role',
            'Delete item',
            'exit'
        ]
    }).then((answer) => {
        switch(answer.action) {
            case 'View all departments':
                displayDepartments();
                break;
            
            case 'Add department':
                addDepartment();
                break;

            case 'View all roles':
                displayRoles();
                break;

            case 'Add role':
                addRole();
                break;

            case 'View all employees':
                displayEmployees();
                break;

            case 'Add employee':
                addEmployee();
            break;

            case 'Update role':
                updateRole();
            break;

            case 'Delete item':
                deleteItem();
            break;

            case 'exit':
                connection.end();
                break;

            default:
                console.log(`Invalid action: ${answer.action}`);
                searchDatabase();
                break;
        }
    })
}

// ============================== DISPLAYING FUNCTIONS ==================================

function displayDepartments () {
    connection.query(`SELECT * FROM department`, function (error, results) {
        if (error) throw error;
        console.clear();
        console.table("Departments", results);
        searchDatabase();
    })
}

function displayRoles () {
    connection.query(`SELECT * FROM role
                     LEFT JOIN department on role.department_id = department.id`, function (error, results) {
        if (error) throw error;
        console.clear();
        console.table("Roles", results);
        searchDatabase();
    })
}

function displayEmployees () {
    connection.query(`SELECT employee.id, employee.first_name, employee.last_name, title, name AS department, salary, manager_id
    FROM employee
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department on role.department_id = department.id
    `, function (error, results) {
        if (error) throw error;
        console.clear();
        console.table("Employees", results);
        searchDatabase();
    })
}


// ============================== ADDING FUNCTIONS ==================================
function addDepartment () {
    inquirer.prompt ([{
        type : "input",
        name: "name",
        message : "What is the department name?"
        },
        {
        type : "input",
        name : "id",
        message: "What is the department id?"
        }
    ]).then(answers => {
        departmentInsert(answers.name, answers.id)
    })
}

function addRole () {
    connection.query(
        `SELECT id, name FROM department`
        //grab departments id and name
    , (error, results) => {
        if (error) throw error;
        for (let i = 0; i < results.length; i++) {
            departmentList.push(results[i].name);
            //add the departments to an array to be chosen from later
        }
        inquirer.prompt ([{
            type : "input",
            name: "title",
            message : "What is the role name?"
            },
            {
            type : "input",
            name : "id",
            message: "What is the id for this role?"
            },
            {
            type : "input",
            name : "salary",
            message: "What is role salary?"
            },
            {
            type : "list",
            name : "deptname",
            message: "Which department does this role belong to?",
            choices: departmentList
            }
            
        ]).then((answers) => {
            let deptId;
            for (let i = 0; i < results.length; i++) {
                //iterate through table results
                if (answers.deptname == results[i].name) {
                    deptId = results[i].id;
                    //grabbing the id associated with the department
                }
            }
            roleInsert(answers.id, answers.title, answers.salary, deptId);
        })
    })
    
};

function addEmployee () {
    connection.query(
        `SELECT id, title, salary, department_id FROM role`
        ,(error, results) => {
            if (error) throw error;
            for (let i = 0; i < results.length; i++) {
                roleList.push(results[i].title)
                //add role to list to be chosen from later
            }
            inquirer.prompt([
                {
                    type: "input",
                    name: "firstname",
                    message: "What is employee's first name?"
                },
                {
                    type: "input",
                    name: "lastname",
                    message: "What is employee's last name?"
                },
                {
                    type: "input",
                    name: "id",
                    message: "What is employee's id?"
                },
                {
                    type : "list",
                    name : "title",
                    message: "What is this employees title?",
                    choices: roleList
                }
            ]).then((answers) => {
                let roleId;
                for (let i = 0; i < results.length; i++) {
                    if(answers.title == results[i].title) {
                        roleId = results[i].id;
                    }
                    
                }
                employeeInsert(answers.id, answers.firstname, answers.lastname, roleId)
            })
        }
    )
}


// ============================== INSERTING FUNCTIONS ==================================

function departmentInsert (name, id) {
    console.log("adding.....", name);
    connection.query(`INSERT INTO employees_db.department SET ?`, {
        id:id,
        name:name
    }, (error) => {
        if(error) throw error;
        console.log("added department", " ", name);
        console.clear();
        displayDepartments();
    })
    
    searchDatabase();
}

function roleInsert (id, title, salary, deptId) {
    console.log("adding.....", title);
    connection.query(`INSERT INTO employees_db.role SET ?`, {
        id:id,
        title:title,
        salary:salary,
        department_id:deptId
    }, (error) => {
        if(error) throw error;
        console.log("added role", " ", title);
        console.clear();
        displayRoles();
    })
    searchDatabase();
}

function employeeInsert(id, firstname, lastname, roleId) {
    console.log(firstname, " ", lastname)
    connection.query(`INSERT INTO employees_db.employee SET ?`, {
        id: id,
        first_name:firstname,
        last_name:lastname,
        role_id:roleId
    }, function (error) {
        if (error) throw error;
        console.log("added employee", firstname, " ", lastname);
        console.clear();
        displayEmployees();
    })
    searchDatabase();
}

//===============================UPDATING ============================

function updateRole () {

    connection.query(`SELECT id, first_name, last_name FROM employee`,
    (error, empResults) => {
        if (error) throw error;
        for (let i = 0; i < empResults.length; i++) {
            empList.push(empResults[i].first_name + " " + empResults[i].last_name)
        }
        connection.query(`SELECT id, title FROM role`,
            (error, roleResults) => {
                if (error) throw error;
                    for (let i = 0; i < roleResults.length; i++) {
                    roleList.push(roleResults[i].title);
                    }
                    inquirer.prompt([
                        {
                            type : "list",
                            name: "empName",
                            message: "Which employee are you updating?",
                            choices : empList
                        },
                        {
                            type:'list',
                            name: 'empRole',
                            message: "Which role do they have now?",
                            choices : roleList
                        }
                    ]).then((answers) => {
                        console.log(answers.empName, " ", answers.empRole)
                        let newRoleId;
                        for (let i = 0; i < roleResults.length; i++) {
                            if (answers.empRole == roleResults[i].title) {
                                newRoleId = roleResults[i].id
                            }
                            
                        }
                        let empId;
                        for (let i = 0; i < empResults.length; i++) {
                            if (empResults[i].first_name + " " + empResults[i].last_name == answers.empName) {
                                empId = empResults[i].id;
                            }
                            
                        }
                        connection.query(`UPDATE employee 
                                          SET role_id = ? 
                                          WHERE id = ?`, 
                        [newRoleId, empId]
                        ,
                        function (error, result) {
                            if (error) throw error;
                            console.log("updated ", answers.empName, "with new role ", answers.empRole)
                            displayEmployees();
                        })
                        searchDatabase();   
            })
        }) 
    })
}

function deleteItem () {
    inquirer.prompt([
        {
            type: "list",
            name: "item",
            message: "What do you want to delete?",
            choices: ["Department", "Role", "Employee"]
        }
    ]).then((answer) => {
        if (answer.item == "Department") {
            connection.query(`SELECT * FROM department`,
            function (error, results) {
                if (error) throw error;
                console.clear()
                inquirer.prompt([
                    {
                        type: "list",
                        name: "department",
                        message: "What do you want to delete?",
                        choices: results
                    }
                ]).then((answer) => {
                    console.log(answer.department, "was the one you chose")
                    let dept = answer.department;
                    connection.query(`DELETE FROM department WHERE name = ?`, dept,
                    function (error, result) {
                        if (error) throw error;
                        console.log(answer.department, "deleted.....")
                        displayDepartments();
                    })
                    
                })
            })
            
        }
        if (answer.item == "Role") {
            connection.query(`SELECT title from role`, 
            function (error, results) {
                if (error) throw error;
                for (let i = 0; i < results.length; i++) {
                    roleList.push(results[i].title)
                }
                console.clear()
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'roleItem',
                        message: 'Which role do you want to delete?',
                        choices: roleList
                    }
                ]).then((answer) => {
                    console.log(answer.roleItem, "was the one you chose")
                    let roleItem = answer.roleItem;
                    connection.query(`DELETE FROM role WHERE title = ?`, roleItem,
                    function (error, result) {
                        if (error) throw error;
                        console.log(answer.roleItem, "deleted.....")
                        displayRoles();
                    })
                })
            })
        }
        if (answer.item == "Employee") {
            connection.query(`SELECT * from employee`, 
            function (error, results) {
                if (error) throw error;
                for (let i = 0; i < results.length; i++) {
                    empList.push(results[i].first_name + " " + results[i].last_name)
                }
                console.clear()
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'employee',
                        message: 'Which employee do you want to delete?',
                        choices: empList
                    }
                ]).then((answer) => {
                    console.log(answer.employee, "was the one you chose")
                    let empItem = answer.employee;
                    connection.query(`DELETE FROM employee WHERE CONCAT(first_name, " ", last_name) = ?`, empItem,
                    function (error, result) {
                        if (error) throw error;
                        console.log(answer.employee, "deleted.....")
                        displayEmployees();
                    })
                })
            })
        }
        console.clear();
        searchDatabase();
    })
}