import camelCaseTounder_score from "./camelCaseTounder_score";
import under_scoreTocamelCase from "./under_scoreTocamelCase";

type Case = "camelCase" | "underscore";
const cases = {camelCase: under_scoreTocamelCase, underscore: camelCaseTounder_score};

export default (object: any, glue: string = " = ", separator: string = " , ", caseToConvert: Case = "underscore") => {
  return Object.entries(object).map(([key, value]) =>
    [
      cases[caseToConvert](key),
      value
    ].join(glue)
  ).join(separator);
};
