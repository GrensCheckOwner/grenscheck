
import MapView, { MapPressEvent, Marker } from 'react-native-maps';

type Props = {
  location: {
    latitude: number;
    longitude: number;
  };
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
  }) => void;
};

export default function MeldingKaart({
  location,
  onLocationChange,
}: Props) {
  function kiesLocatie(event: MapPressEvent) {
    onLocationChange(event.nativeEvent.coordinate);
  }

  return (
    <MapView
      style={{ flex: 1 }}
      showsUserLocation
      userInterfaceStyle="dark"
      region={{
        ...location,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }}
      onPress={kiesLocatie}
    >
      <Marker coordinate={location} />
    </MapView>
  );
}
