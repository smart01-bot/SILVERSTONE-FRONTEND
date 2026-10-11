import React, { useState } from 'react';
import { RegistrationFrame, GlassField, GlassButton, RegistrationText, TextAction } from '../../components/auth/RegistrationUI';
import { useAuthStyle } from '../../components/auth/AuthUI';

// Keep the route and coordinate contract. The former drawn map manufactured locations;
// use an explicit address and optional user-supplied coordinates until a real map is connected.
export default function Step4aMap({ navigation, route }) {
  const { copy } = useAuthStyle();
  const p = route.params || {};
  const [location, setLocation] = useState(p.location ?? p.businessLocation ?? '');
  const [lat, setLat] = useState(p.coordinates?.lat?.toString() ?? '');
  const [lng, setLng] = useState(p.coordinates?.lng?.toString() ?? '');
  const [expanded, setExpanded] = useState(!!p.coordinates);
  const [error, setError] = useState('');
  function confirm() {
    if (location.trim().length < 3) { setError(copy('Enter your business location.', 'Weka eneo la biashara yako.')); return; }
    let coordinates = null;
    if (lat.trim() || lng.trim()) {
      if (!lat.trim() || !lng.trim() || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180) {
        setError(copy('Check both coordinates.', 'Kagua viwianishi vyote viwili.')); return;
      }
      coordinates = { lat: Number(lat), lng: Number(lng) };
    }
    navigation.navigate('Step4Business', { ...p, location: location.trim(), coordinates });
  }
  return <RegistrationFrame step={4} onBack={() => navigation.goBack()} title={copy('Business location', 'Eneo la biashara')} description={copy('Where is your till?', 'Biashara yako ipo wapi?')}
    footer={<><RegistrationText error>{error}</RegistrationText><GlassButton label={copy('Use this location', 'Tumia eneo hili')} onPress={confirm} /></>}>
    <GlassField label={copy('Area and landmark', 'Eneo na alama ya karibu')} value={location} onChangeText={setLocation} placeholder={copy('Area, street, nearby landmark', 'Eneo, mtaa, alama ya karibu')} maxLength={300} multiline />
    <TextAction label={expanded ? copy('Hide coordinates', 'Ficha viwianishi') : copy('Add coordinates (optional)', 'Ongeza viwianishi (si lazima)')} onPress={() => setExpanded(v => !v)} />
    {expanded && <><GlassField label={copy('Latitude', 'Latitudo')} value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" placeholder="-6.8" />
      <GlassField label={copy('Longitude', 'Longitudo')} value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" placeholder="39.3" /></>}
  </RegistrationFrame>;
}
