import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
  BelongsToMany,
  Sequelize,
  Unique
} from "sequelize-typescript";

import { Line } from "./Line";
import { LineStation } from "./LineStation";

@Table({
  underscored: true
})
export class Station extends Model<Station> {

  @Unique
  @Column
  name!: string;

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

  @BelongsToMany(() => Line, {
    through: {
      model: () => LineStation,
      unique: false
    },
    foreignKey: {
      name: 'station_id',
      unique: false
    }
  })
  lines?: Array<Line & { LineStation: LineStation }>;

}
