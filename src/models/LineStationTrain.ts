import {
    Column,
    CreatedAt,
    Model,
    Table,
    ForeignKey,
    UpdatedAt,
    Sequelize
  } from "sequelize-typescript";
  
import { Train } from "./Train";
import { DataTypes } from "sequelize";
import { LineStation } from "./LineStation";
import { Line } from "./Line";
  
  @Table({
    underscored: true
  })
  export class LineStationTrain extends Model<LineStationTrain> {

    @Column({
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    })
    id!: number;

    @ForeignKey(() => Train)
    @Column({
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'lines_stations_trains_unique'
    })
    trainId!: number;

    @ForeignKey(() => Line)
    @Column({
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'lines_stations_trains_unique'
    })
    lineId!: number;

    @ForeignKey(() => LineStation)
    @Column({
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'lines_stations_trains_unique'
    })
    lineStationId!: number;

    @Column(DataTypes.TIME)
    arrivalTime!: Date;

    @Column(DataTypes.TIME)
    departureTime!: Date;

    @Column({
      type: DataTypes.BOOLEAN,
      defaultValue: false
    })
    isArrival!: boolean;

    @Column({
      type: DataTypes.BOOLEAN,
      defaultValue: false
    })
    isDeprature!: boolean;
  
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
  