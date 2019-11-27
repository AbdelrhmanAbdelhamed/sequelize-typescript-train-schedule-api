import {
    Column,
    CreatedAt,
    Model,
    Table,
    ForeignKey,
    UpdatedAt,
    Sequelize
  } from "sequelize-typescript";
  
  import { Line } from "./Line";
  import { Train } from "./Train";
  import { Station } from "./Station";
  
  @Table({
    underscored: true
  })
  export class LineTrainStation extends Model<LineTrainStation> {
  
    @ForeignKey(() => Line)
    @Column
    lineId!: number;

    @ForeignKey(() => Train)
    @Column
    trainId!: number;
  
    @ForeignKey(() => Station)
    @Column
    stationId!: number;

    arrivalTime!: Date;
    departureTime!: Date;

    isArrival!: boolean;
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
    UpdatedAt?: Date;
  
  }
  