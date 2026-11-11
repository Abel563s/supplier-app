export function csrfHeaders(): Record<string, string> {
    const cookie = document.cookie.split('; ').find((value) => value.startsWith('XSRF-TOKEN='));

    if (!cookie) {
        throw new Error('The XSRF-TOKEN cookie is missing.');
    }

    return {
        'X-XSRF-TOKEN': decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)),
    };
}
