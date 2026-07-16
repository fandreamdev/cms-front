export const stringifySettingValue = (value: unknown) => {
  const json = JSON.stringify(value, null, 2)
  return json === undefined ? String(value) : json
}

export const parseSettingValue = (valueText: string): unknown => JSON.parse(valueText)
