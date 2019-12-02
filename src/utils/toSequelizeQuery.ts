const { rulesToQuery } = require('@casl/ability/extra')

function ruleToQuery(rule) {
  if (JSON.stringify(rule.conditions).includes('"$all":')) {
    throw new Error('Sequelize does not support "$all" operator')
  }
  return rule.inverted ? { $not: rule.conditions } : rule.conditions
}

export default function toSequelizeQuery(ability, subject, action = 'read') {
  return rulesToQuery(ability, action, subject, ruleToQuery)
}