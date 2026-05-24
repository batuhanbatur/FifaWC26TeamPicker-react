const base = import.meta.env.BASE_URL

export const flagUrl = (code) => `${base}flags/${code}.svg`
