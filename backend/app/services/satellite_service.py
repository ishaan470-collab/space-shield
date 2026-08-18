import requests
import math
import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.models import SatelliteCache
from backend.app.models.schemas import SatelliteSearchResponse

# Earth parameters
GM = 398600.44  # km^3/s^2
R_E = 6371.0    # km (Earth radius)

# Hardcoded fallback list for offline/development robustness
MOCK_SATELLITES = {
    "iss": {
        "satellite_name": "ISS (ZARYA)",
        "norad_id": "25544",
        "altitude": 420.0,
        "velocity": 7.66,
        "inclination": 51.64,
        "orbital_period": 92.8,
        "eccentricity": 0.0004
    },
    "hubble": {
        "satellite_name": "HUBBLE SPACE TELESCOPE",
        "norad_id": "20580",
        "altitude": 525.0,
        "velocity": 7.59,
        "inclination": 28.47,
        "orbital_period": 95.1,
        "eccentricity": 0.0003
    },
    "starlink": {
        "satellite_name": "STARLINK-31002",
        "norad_id": "58156",
        "altitude": 550.0,
        "velocity": 7.59,
        "inclination": 53.0,
        "orbital_period": 95.6,
        "eccentricity": 0.0001
    },
    "cartosat": {
        "satellite_name": "CARTOSAT-2E",
        "norad_id": "42767",
        "altitude": 505.0,
        "velocity": 7.61,
        "inclination": 97.46,
        "orbital_period": 94.7,
        "eccentricity": 0.0012
    }
}

def calculate_orbital_elements(mean_motion: float, eccentricity: float):
    """
    Calculate semi-major axis (altitude) and orbital velocity from Mean Motion (revs/day).
    Kepler's Third Law: T^2 = 4*pi^2 * a^3 / GM
    """
    if mean_motion <= 0:
        return 0.0, 0.0, 0.0
        
    # Period in minutes
    orbital_period = 1440.0 / mean_motion
    
    # Mean motion in rad/s
    n_rad = (mean_motion * 2.0 * math.pi) / 86400.0
    
    # Semi-major axis in km
    semi_major_axis = (GM / (n_rad ** 2)) ** (1.0 / 3.0)
    
    # Altitude in km (at perigee/apogee average, simplified as a - R_E)
    altitude = semi_major_axis - R_E
    
    # Average orbital velocity in km/s (v = sqrt(GM/a) for circular approximation)
    velocity = math.sqrt(GM / semi_major_axis)
    
    return float(altitude), float(velocity), float(orbital_period)

def get_satellite_from_api(query: str):
    """
    Queries Celestrak's live GP (General Perturbations) API
    """
    query_clean = query.strip()
    
    # Determine search parameter (CATNR for numeric NORAD id, NAME for search query)
    is_numeric = query_clean.isdigit()
    param_name = "CATNR" if is_numeric else "NAME"
    
    url = f"https://celestrak.org/NORAD/elements/gp.php?{param_name}={query_clean}&FORMAT=json"
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Parse first matching satellite
                sat_data = data[0]
                mean_motion = float(sat_data.get("MEAN_MOTION", 15.5))
                eccentricity = float(sat_data.get("ECCENTRICITY", 0.0001))
                
                altitude, velocity, orbital_period = calculate_orbital_elements(mean_motion, eccentricity)
                
                return {
                    "satellite_name": sat_data.get("OBJECT_NAME", "Unknown"),
                    "norad_id": str(sat_data.get("NORAD_CAT_ID", "")),
                    "altitude": round(altitude, 2),
                    "velocity": round(velocity, 2),
                    "inclination": round(float(sat_data.get("INCLINATION", 0.0)), 4),
                    "orbital_period": round(orbital_period, 2),
                    "eccentricity": round(eccentricity, 6)
                }
    except Exception as e:
        print(f"API Error fetching satellite '{query}': {str(e)}")
    
    return None

def search_satellite(query: str, db: Session) -> Optional[SatelliteSearchResponse]:
    """
    Tries to find a satellite:
    1. Check Local DB Cache. If cached and fresh (< 24 hours), return cache.
    2. Check Celestrak Live API. If found, cache in DB and return.
    3. Check hardcoded mock values. If found, return.
    4. Return None if not found.
    """
    query_lower = query.lower().strip()
    
    # 1. Check Local Cache
    cached_sat = db.query(SatelliteCache).filter(
        (SatelliteCache.satellite_name.ilike(f"%{query_lower}%")) |
        (SatelliteCache.norad_id == query_lower)
    ).first()
    
    # If cache exists and is fresh (< 24 hours)
    if cached_sat:
        age = datetime.datetime.utcnow() - cached_sat.last_updated
        if age < datetime.timedelta(hours=24):
            return SatelliteSearchResponse(
                satellite_name=cached_sat.satellite_name,
                norad_id=cached_sat.norad_id,
                altitude=cached_sat.altitude,
                velocity=cached_sat.velocity,
                inclination=cached_sat.inclination,
                orbital_period=cached_sat.orbital_period,
                eccentricity=cached_sat.eccentricity
            )
            
    # 2. Query Celestrak API
    api_res = get_satellite_from_api(query_lower)
    
    if api_res:
        # Update or create database cache
        db_sat = db.query(SatelliteCache).filter(SatelliteCache.norad_id == api_res["norad_id"]).first()
        if not db_sat:
            db_sat = SatelliteCache(
                satellite_name=api_res["satellite_name"],
                norad_id=api_res["norad_id"],
                altitude=api_res["altitude"],
                velocity=api_res["velocity"],
                inclination=api_res["inclination"],
                orbital_period=api_res["orbital_period"],
                eccentricity=api_res["eccentricity"]
            )
            db.add(db_sat)
        else:
            db_sat.satellite_name = api_res["satellite_name"]
            db_sat.altitude = api_res["altitude"]
            db_sat.velocity = api_res["velocity"]
            db_sat.inclination = api_res["inclination"]
            db_sat.orbital_period = api_res["orbital_period"]
            db_sat.eccentricity = api_res["eccentricity"]
            db_sat.last_updated = datetime.datetime.utcnow()
            
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to cache satellite: {e}")
            
        return SatelliteSearchResponse(**api_res)
        
    # 3. Check hardcoded fallback mock data
    for key, val in MOCK_SATELLITES.items():
        if key in query_lower or query_lower == val["norad_id"]:
            # Optionally cache the fallback in database
            db_sat = db.query(SatelliteCache).filter(SatelliteCache.norad_id == val["norad_id"]).first()
            if not db_sat:
                db_sat = SatelliteCache(
                    satellite_name=val["satellite_name"],
                    norad_id=val["norad_id"],
                    altitude=val["altitude"],
                    velocity=val["velocity"],
                    inclination=val["inclination"],
                    orbital_period=val["orbital_period"],
                    eccentricity=val["eccentricity"]
                )
                db.add(db_sat)
                db.commit()
            return SatelliteSearchResponse(**val)
            
    return None
