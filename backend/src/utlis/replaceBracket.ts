export function replaceBracket(template: string, ...values: string[]){
    return template.replace(/{}/g, () => {
        return values.shift() ?? 'NOT_DEFINED'
    })
}