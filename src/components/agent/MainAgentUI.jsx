import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { ThemeContext, useTheme } from '../../context/ThemeContext';
import { agentColors } from './agentTheme';
import { AgentUIProvider, AgentButton } from './AgentUI';
import { ThemeReveal, useThemeReveal } from './ThemeReveal';
import SwiftWakalaMark from '../SwiftWakalaMark';
import PressFeedback from '../PressFeedback';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/theme';

// Scoped palette: legacy review/operations components inherit the same visual system.
export function MainAgentUIProvider({ children }) {
  const base = useTheme();
  const value = useMemo(() => {
    const c = agentColors(base.isDark);
    return { ...base, theme: { ...base.theme, ...c, textMid:c.text, textDim:c.secondary,
      surfaceAlt:c.surface, surfaceElev:c.surface, borderStrong:c.strongBorder,
      primary:c.text, onPrimary:c.bg, primaryLight:c.selected,
      gradPrimA:c.text,gradPrimB:c.text,gradSurfA:c.surface,gradSurfB:c.surface,
      success:base.isDark?'#86D6AE':'#246347',warning:base.isDark?'#E6C178':'#765611',
      danger:c.danger,info:c.secondary,
    }};
  }, [base.theme,base.isDark,base.lang,base.userPreference,base.setTheme,base.setLang,base.tr]);
  return <ThemeContext.Provider value={value}><AgentUIProvider><ThemeReveal>{children}</ThemeReveal></AgentUIProvider></ThemeContext.Provider>;
}
export function MainHeader({ navigation, title, subtitle, action, actionLabel, actionIcon='options-outline' }) {
  const { theme, isDark, lang, setLang } = useTheme();
  const { toggle, error: appearanceError } = useThemeReveal();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [languageError, setLanguageError] = useState('');
  const [languageBusy, setLanguageBusy] = useState(false);
  const changeLanguage = async () => {
    setLanguageBusy(true);
    setLanguageError('');
    try { await setLang(lang === 'sw' ? 'en' : 'sw'); }
    catch { setLanguageError(lang === 'sw' ? 'Lugha haikuhifadhiwa. Tafadhali jaribu tena.' : 'Language could not be saved. Please try again.'); }
    finally { setLanguageBusy(false); }
  };
  return <View style={{backgroundColor:theme.bg}}>
    <StatusBar barStyle={isDark?'light-content':'dark-content'} backgroundColor={theme.bg} />
    <View style={[s.brandRow, compact && s.compactRow]}>
      <View accessible accessibilityLabel="Swift Wakala by Silverstone" style={s.brand}>
        <SwiftWakalaMark size={compact ? 26 : 32} color={theme.text}/><View style={{flexShrink:1}}>
          <Text numberOfLines={1} style={[s.brandName,compact && s.compactBrand,{color:theme.text}]}>Swift Wakala</Text>
          <Text numberOfLines={1} style={[s.owner,compact && s.compactOwner,{color:theme.textDim}]}>by Silverstone</Text>
        </View>
      </View>
      <PressFeedback testID="main-language-toggle" onPress={changeLanguage} disabled={languageBusy} accessibilityRole="button"
        accessibilityLabel={lang==='sw'?'Lugha: Kiswahili. Badili kwenda English.':'Language: English. Switch to Kiswahili.'}
        accessibilityState={{ disabled: languageBusy, busy: languageBusy }}
        style={[s.icon,{backgroundColor:theme.glass,borderColor:theme.glassBorder}]}>
        <Text style={[s.languageText,{color:theme.text}]}>{lang==='sw'?'SW':'EN'}</Text>
      </PressFeedback>
      <PressFeedback testID="main-theme-toggle" onPress={event => toggle({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })} accessibilityRole="button"
        accessibilityLabel={lang==='sw'?(isDark?'Tumia mwanga':'Tumia giza'):(isDark?'Switch to light mode':'Switch to dark mode')}
        style={[s.icon,{backgroundColor:theme.glass,borderColor:theme.glassBorder}]}>
        <Ionicons name={isDark?'sunny-outline':'moon-outline'} size={23} color={theme.text}/>
      </PressFeedback>
      {navigation?.openDrawer && <PressFeedback onPress={()=>navigation.openDrawer()} accessibilityRole="button"
        accessibilityLabel={lang==='sw'?'Fungua menyu':'Open menu'} style={[s.icon,{backgroundColor:theme.glass,borderColor:theme.glassBorder}]}>
        <Ionicons name="menu-outline" size={24} color={theme.text}/>
      </PressFeedback>}
    </View>
    {appearanceError ? <Text accessibilityRole="alert" style={[s.appearanceError,{color:theme.danger}]}>{appearanceError}</Text> : null}
    {languageError ? <Text accessibilityRole="alert" style={[s.appearanceError,{color:theme.danger}]}>{languageError}</Text> : null}
    <View style={s.heading}>
      <View style={s.headingCopy}>
        <Text accessibilityRole="header" style={[s.title,{color:theme.text}]}>{title}</Text>
        {subtitle ? <Text style={[s.subtitle,{color:theme.textDim}]}>{subtitle}</Text>:null}
      </View>
      {action && <PressFeedback onPress={action} accessibilityRole="button" accessibilityLabel={actionLabel}
        style={[s.icon,{backgroundColor:theme.glass,borderColor:theme.glassBorder}]}>
        <Ionicons name={actionIcon} size={23} color={theme.text}/>
      </PressFeedback>}
    </View>
  </View>;
}
export function MainEmpty({ title, description, icon='reader-outline' }) {
  const { theme } = useTheme();
  return <View style={s.empty}>
    <View style={[s.emptyIcon,{backgroundColor:theme.surface,borderColor:theme.border}]}><Ionicons name={icon} size={32} color={theme.text}/></View>
    <Text style={[s.emptyTitle,{color:theme.text}]}>{title}</Text>
    <Text style={[s.subtitle,{color:theme.textDim,textAlign:'center'}]}>{description}</Text>
  </View>;
}
export function MainError({ message, onRetry, busy }) {
  const {theme,lang}=useTheme();
  if(!message)return null;
  return <View style={{paddingVertical:16,gap:8}}><Text accessibilityRole="alert" style={[s.subtitle,{color:theme.danger}]}>{message}</Text>
    <AgentButton variant="text" icon="refresh-outline" label={lang==='sw'?'Jaribu tena':'Retry loading'} onPress={onRetry} disabled={busy} busy={busy}/></View>;
}
const s=StyleSheet.create({
  brandRow:{paddingHorizontal:24,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:8},
  compactRow:{paddingHorizontal:16,gap:6},compactBrand:{fontSize:14},compactOwner:{fontSize:10},
  brand:{flex:1,flexDirection:'row',alignItems:'center',gap:8},brandName:{fontFamily:fonts.bodySemi,fontSize:16,flexShrink:1},
  owner:{fontFamily:fonts.body,fontSize:11,lineHeight:16},
  icon:{width:44,height:44,borderRadius:22,borderWidth:1,alignItems:'center',justifyContent:'center'},
  languageText:{fontFamily:fonts.bodySemi,fontSize:12,lineHeight:18},
  heading:{paddingHorizontal:24,paddingTop:4,paddingBottom:16,gap:12,flexDirection:'row',alignItems:'center'},
  headingCopy:{flex:1,gap:7},appearanceError:{paddingHorizontal:24,paddingBottom:8,fontFamily:fonts.body,fontSize:13,lineHeight:20},
  title:{fontFamily:fonts.display,fontSize:30,lineHeight:39,letterSpacing:-0.8},
  subtitle:{fontFamily:fonts.body,fontSize:15,lineHeight:23},empty:{paddingVertical:40,alignItems:'center',gap:14},
  emptyIcon:{width:76,height:80,borderRadius:24,borderWidth:1,alignItems:'center',justifyContent:'center'},
  emptyTitle:{fontFamily:fonts.bodySemi,fontSize:21,lineHeight:29,textAlign:'center'},
});
