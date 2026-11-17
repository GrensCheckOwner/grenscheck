
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

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

export default function MeldingKaartWeb({
  location,
  onLocationChange,
}: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const onChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    let actief = true;

    async function startKaart() {
      if (!mapElement.current || mapInstance.current) return;

      const L = await import('leaflet');
      L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

      if (!actief || !mapElement.current) return;

      const kaart = L.map(mapElement.current).setView(
        [location.latitude, location.longitude],
        8
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap-bijdragers',
      }).addTo(kaart);

     const pinIcon = L.divIcon({
  html: '<span style="font-size: 30px;">👮</span>',
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const marker = L.marker(
  [location.latitude, location.longitude],
  { icon: pinIcon }
).addTo(kaart);

      kaart.on('click', (event: any) => {
        const nieuweLocatie = {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        };

        marker.setLatLng([
          nieuweLocatie.latitude,
          nieuweLocatie.longitude,
        ]);

        onChangeRef.current(nieuweLocatie);
      });

      mapInstance.current = kaart;
      markerInstance.current = marker;
    }

    startKaart();

    return () => {
      actief = false;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      markerInstance.current.setLatLng([
        location.latitude,
        location.longitude,
      ]);
    }
  }, [location.latitude, location.longitude]);

  return (
    <div
      ref={mapElement}
      style={{
        width: '100%',
        height: '350px',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    />
  );
}
