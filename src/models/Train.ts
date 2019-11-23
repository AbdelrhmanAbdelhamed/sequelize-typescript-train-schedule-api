import {
  Column,
  CreatedAt,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  HasMany,
  UpdatedAt,
  Sequelize,
  Unique,
} from "sequelize-typescript";

import { Line } from "./Line";
import { TrainRun } from "./TrainRun";

@Table({
  underscored: true
})
export class Train extends Model<Train> {

  @Unique
  @Column
  number!: string;

  @ForeignKey(() => Line)
  @Column
  lineId!: number;

  @BelongsTo(() => Line)
  line?: Line;

  @HasMany(() => TrainRun)
  trainRuns?: TrainRun;

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
