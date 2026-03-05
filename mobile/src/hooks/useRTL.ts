import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

interface RTLValues {
  isRTL: boolean;
  direction: 'rtl' | 'ltr';
  textAlign: 'right' | 'left';
  flexDirection: 'row-reverse' | 'row';
}

export function useRTL(): RTLValues {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const isRTL = i18n.language === 'ar';
    return {
      isRTL,
      direction: isRTL ? 'rtl' : 'ltr',
      textAlign: isRTL ? 'right' : 'left',
      flexDirection: isRTL ? 'row-reverse' : 'row',
    };
  }, [i18n.language]);
}
