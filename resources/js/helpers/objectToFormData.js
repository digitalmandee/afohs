export const objectToFormData = (obj, form = new FormData(), namespace = '') => {
    for (let key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key) || obj[key] === null || obj[key] === undefined) continue;

        const value = obj[key];
        const formKey = namespace ? `${namespace}[${key}]` : key;

        if (value instanceof File) {
            form.append(formKey, value);
        } else if (Array.isArray(value)) {
            value.forEach((element, index) => {
                const arrayKey = `${formKey}[${index}]`;
                if (typeof element === 'object' && !(element instanceof File)) {
                    objectToFormData(element, form, arrayKey); // recurse into array element
                } else {
                    form.append(arrayKey, element);
                }
            });
        } else if (typeof value === 'object') {
            objectToFormData(value, form, formKey); // recurse into object
        } else {
            form.append(formKey, value);
        }
    }
    return form;
};
