// ============================================================
//  通用设置 
// ============================================================
import { Globe, Type } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import type { FontFamily, FontSize, LineHeight } from '../../stores/configStore';
import { Section, SettingRow, SegmentedControl, Select, Toggle } from './SettingsUIComponents';

export default function GeneralSettingsTab() {
  const { settings, updateSettings, t } = useConfigStore();

  return (
    <div style={{ maxWidth: 560 }}>
      {/* 语言 */}
      <Section icon={<Globe size={15} />} title={t('settings.language')}>
        <SettingRow label={t('settings.language')}>
          <SegmentedControl
            options={[{ label: '简体中文', value: 'zh-CN' }, { label: 'English', value: 'en' }]}
            value={settings.language}
            onChange={v => updateSettings('language', v as 'zh-CN' | 'en')}
          />
        </SettingRow>
      </Section>

      {/* 排版 */}
      <Section icon={<Type size={15} />} title="排版">
        <SettingRow label={t('settings.font')}>
          <Select
            options={[
              { label: t('font.yahei'), value: 'yahei' },
              { label: t('font.source'), value: 'source' },
            ]}
            value={settings.font}
            onChange={v => updateSettings('font', v as FontFamily)}
            width="120px"
          />
        </SettingRow>
        <SettingRow label={t('settings.bodyFontSize')} desc={t('settings.bodyFontSize.desc')}>
          <SegmentedControl
            options={[
              { label: t('common.small'), value: '小' },
              { label: t('common.medium'), value: '中' },
              { label: t('common.large'), value: '大' },
            ]}
            value={settings.bodyFontSize}
            onChange={v => updateSettings('bodyFontSize', v as FontSize)}
          />
        </SettingRow>
        <SettingRow label={t('settings.lineHeight')}>
          <SegmentedControl
            options={[
              { label: t('common.compact'), value: '紧凑' },
              { label: t('common.comfortable'), value: '舒适' },
              { label: t('common.loose'), value: '宽松' },
            ]}
            value={settings.lineHeight}
            onChange={v => updateSettings('lineHeight', v as LineHeight)}
          />
        </SettingRow>
        <SettingRow label={t('settings.autoScroll')}>
          <Toggle value={settings.autoScroll} onChange={v => updateSettings('autoScroll', v)} />
        </SettingRow>
      </Section>
    </div>
  );
}
