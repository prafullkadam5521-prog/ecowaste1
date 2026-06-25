/**
 * AI Recommendation Engine
 * Scores and ranks facilities based on distance, rating,
 * waste type compatibility, and user past behavior.
 */

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const scoreAndRankFacilities = (facilities, { userLat, userLng, wasteTypes, pastRequests = [] }) => {
  const usedFacilityIds = pastRequests
    .filter((r) => r.status === 'completed')
    .map((r) => r.facility.toString());

  return facilities
    .map((facility) => {
      const [facLng, facLat] = facility.location.coordinates;
      const distanceKm = haversineDistance(userLat, userLng, facLat, facLng);

      // Distance score: closer = higher (max 40 pts)
      const distanceScore = Math.max(0, 40 - distanceKm * 2);

      // Rating score: 0-5 mapped to 0-30 pts
      const ratingScore = (facility.rating / 5) * 30;

      // Certification bonus: 10 pts
      const certScore = facility.isCertified ? 10 : 0;

      // Waste type match score: each matching type = 5 pts (max 15)
      const matchCount = wasteTypes.filter((w) => facility.wasteTypes.includes(w)).length;
      const wasteMatchScore = Math.min(matchCount * 5, 15);

      // Past usage bonus: user completed a request here before = 5 pts
      const pastUsageScore = usedFacilityIds.includes(facility._id.toString()) ? 5 : 0;

      const totalScore = distanceScore + ratingScore + certScore + wasteMatchScore + pastUsageScore;

      return {
        facility,
        distanceKm: Math.round(distanceKm * 10) / 10,
        score: Math.round(totalScore * 10) / 10,
        scoreBreakdown: { distanceScore, ratingScore, certScore, wasteMatchScore, pastUsageScore },
      };
    })
    .sort((a, b) => b.score - a.score);
};

module.exports = { scoreAndRankFacilities };
