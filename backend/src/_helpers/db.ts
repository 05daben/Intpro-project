import config from '../../config.json';
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
    let sequelize: Sequelize;
    
    // Check if DATABASE_URL or POSTGRES_URL environment variable is provided (Vercel / Neon production), or config.databaseUrl
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || config.databaseUrl;
    
    if (connectionString) {
        console.log('🔌 Connecting to database via Environment Connection String (PostgreSQL)...');
        sequelize = new Sequelize(connectionString, {
            dialect: 'postgres',
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            logging: false
        });
    } else {
        // Fall back to local MySQL config
        console.log('🔌 Connecting to database via config.json (Local MySQL)...');
        const mysql = await import('mysql2/promise');
        const { host, port, user, password, database } = config.database;
        try {
            const connection = await mysql.default.createConnection({ host, port, user, password });
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        } catch (err: any) {
            console.warn(`⚠️ Local database auto-creation warning: ${err.message}`);
        }

        sequelize = new Sequelize(database, user, password, {
            dialect: 'mysql',
            host,
            port,
            logging: false
        });
    }

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
            { name: 'Engineering', description: 'Software engineering and IT operations' },
            { name: 'Human Resources', description: 'Employee benefits, onboarding and recruitment' },
            { name: 'Marketing', description: 'Brand management and digital advertising campaigns' }
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
