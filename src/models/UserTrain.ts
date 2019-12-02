import {
    Column,
    CreatedAt,
    Model,
    Table,
    ForeignKey,
    UpdatedAt,
    Sequelize
} from "sequelize-typescript";

import { DataTypes } from "sequelize";
import { User } from "./User";
import { Train } from "./Train";

@Table({
    underscored: true
})
export class UserTrain extends Model<UserTrain> {

    @Column({
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id!: number;

    @ForeignKey(() => User)
    @Column
    userId!: number;

    @ForeignKey(() => Train)
    @Column
    trainId!: number;

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
