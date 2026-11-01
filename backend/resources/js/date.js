export function formatDate(value) {
    if (!value) return 'Non renseignée';

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })
        .format(new Date(year, month - 1, day));
}
