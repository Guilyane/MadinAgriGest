import { locale, t } from './i18n';

export function formatDate(value) {
    if (!value) return t('Non renseignée');

    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium' })
        .format(new Date(year, month - 1, day));
}
