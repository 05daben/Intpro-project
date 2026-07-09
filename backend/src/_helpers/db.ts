import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';
import departmentModel from '../departments/department.model';
import employeeModel from '../employees/employee.model';
import requestModel from '../requests/request.model';

const db: any = {};
export default db;

initialize();

async function initialize() {
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    const sequelize = new Sequelize(database, user, password, {
        dialect: 'mysql',
        host,
        port,
        logging: false
    });

    db.Account = accountModel(sequelize);
    db.RefreshToken = refreshTokenModel(sequelize);
    db.Department = departmentModel(sequelize);
    db.Employee = employeeModel(sequelize);
    db.Request = requestModel(sequelize);

    // Relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    await sequelize.sync({ alter: true });

    // Seed default admin
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);
    const adminAccount = await db.Account.findOne({ where: { email: 'admin@example.com' } });
    if (!adminAccount) {
        await db.Account.create({
            email: 'admin@example.com',
            passwordHash: hashedPassword,
            title: 'Mr',
            firstName: 'System',
            lastName: 'Admin',
            acceptTerms: true,
            role: 'Admin',
            verified: new Date()
        });
        console.log('✅ Default admin account seeded: admin@example.com / admin123');
    } else {
        adminAccount.passwordHash = hashedPassword;
        adminAccount.role = 'Admin';
        await adminAccount.save();
        console.log('✅ Default admin account updated: admin@example.com / admin123');
    }

    // Seed default departments
    const deptCount = await db.Department.count();
    if (deptCount === 0) {
        await db.Department.bulkCreate([
            { id: 1, name: 'Engineering', description: 'Software engineering and IT operations' },
            { id: 2, name: 'Human Resources', description: 'Employee benefits, onboarding and recruitment' },
            { id: 3, name: 'Marketing', description: 'Brand management and digital advertising campaigns' }
        ]);
        console.log('✅ Default departments seeded');
    }

    // Seed default employees
    const empCount = await db.Employee.count();
    if (empCount === 0) {
        await db.Employee.create({
            empId: 'EMP001',
            email: 'admin@example.com',
            firstName: 'System',
            lastName: 'Admin',
            position: 'IT Director',
            department: 'Engineering',
            hireDate: '2020-01-15'
        });
        console.log('✅ Default employee EMP001 seeded');
    }

    // Seed default requests
    const reqCount = await db.Request.count();
    if (reqCount === 0) {
        await db.Request.bulkCreate([
            { id: 1718000000001, type: 'Hardware Procurement', items: { device: 'MacBook Pro M3', RAM: '32GB' }, status: 'Approved', date: '2026-07-01', employeeEmail: 'admin@example.com' },
            { id: 1718000000002, type: 'Software Access', items: { software: 'Adobe Creative Cloud' }, status: 'Pending', date: '2026-07-05', employeeEmail: 'admin@example.com' }
        ]);
        console.log('✅ Default requests seeded');
    }
}
