import {
    Column,
    CreatedAt,
    Model,
    Table,
    UpdatedAt,
    Sequelize,
    Unique,
    HasMany
} from "sequelize-typescript";

import { User } from "./User";
@Table({
    underscored: true
})
export class Role extends Model<Role> {

    @Unique
    @Column
    name!: string;

    @Unique
    @Column
    nameArabic!: string;

    @Column
    Description!: string;
    
    @HasMany(() => User)
    users?: User[];

    @CreatedAt
    @Column({
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    })
    createdAt?: Date;

    @UpdatedAt
    @Column({
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    })
    updatedAt?: Date;

}
