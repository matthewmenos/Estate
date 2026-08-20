/**
 * Geocodes an address to lat/lng using OpenStreetMap's Nominatim API — free,
 * no API key required, unlike Google/Mapbox geocoding. Nominatim's usage
 * policy (https://operations.osmfoundation.org/policies/nominatim/) requires
 * a real User-Agent identifying the app and asks for at most 1 request/sec,
 * which is well within what this app needs (geocoding happens once per
 * listing creation/address edit, not on every page view).
 */
export async function geocodeAddress(
  address: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, ${city}, Ghana`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          // Required by Nominatim's usage policy — identifies the app and
          // gives them a way to contact you if there's a problem.
          "User-Agent": "AccraRentals/1.0 (contact: set-your-email-here@example.com)",
        },
      }
    );
    if (!res.ok) return null;
    const results = await res.json();
    if (!results?.[0]) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null; // best-effort — a listing without coordinates just won't show a map
  }
}
