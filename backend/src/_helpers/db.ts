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
            role: 'admin',
            verified: new Date()
        });
        console.log('✅ Default admin account seeded: admin@example.com / admin123');
    } else {
        adminAccount.passwordHash = hashedPassword;
        adminAccount.role = 'admin';
        await adminAccount.save();
        console.log('✅ Default admin account updated: admin@example.com / admin123');
    }
}
