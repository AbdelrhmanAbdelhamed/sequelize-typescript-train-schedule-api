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
  BelongsToMany: any = BelongsToMany;

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

  @this.BelongsToMany(() => Line, {
    through: {
      model: () => LineStation,
      unique: false,
      foreignKey: 'station_id'
    }
  })
  lines?: Array<Line & { LineStation: LineStation }>;

}
