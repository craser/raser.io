/*
 * GpsLocation.java
 *
 * Created on October 24, 2007, 9:52 PM
 */

package net.kukido.maps;

import java.util.Date;

/**
 *
 * @author  craser
 */
public class GpsLocation implements Comparable
{
    private float latitude;
    private float longitude;
    private float elevation;
    private float grade;
    private double distance; // Distance from start of track.
    private float bpm; // Heart Rate in beats per minute
    private Date timestamp = new Date(0);
    private long routeTime = 0; // Number of seconds from start of route.
    /** 
     * Earth's radius in km. 
     */
    static public final double EARTH_RADIUS_KM = 6371d;
    
    public GpsLocation() {
    }
    
    public GpsLocation(float lat, float lon, float ele, Date time) {
        this(lat, lon, ele, 0f, 0f, time);
    }
    
    /** Creates a new instance of GpsLocation */
    public GpsLocation(float lat, float lon, float ele, float grade, float bpm, Date time) {
        this.latitude = lat;
        this.longitude = lon;
        this.elevation = ele;
        this.timestamp = time;
        this.bpm = bpm;
        this.grade = grade;
    }
    
    public float getHeartRate() {
    	return bpm;
    }
    
    public void setHeartRate(float bpm) {
    	this.bpm = bpm;
    }
    
    public float getGrade() {
        return grade;
    }
    
    public void setGrade(float grade) {
        this.grade = grade;
    }

    /**
     * Getter for property distance.
     * @return The distance along the track to this point.
     */
    public double getDistance() {
        return distance;
    }

    /**
     * Setter for property distance.
     * @param distance The distance along the track to this point.
     */
    public void setDistance(double distance) {
        this.distance = distance;
    }

    /**
     * Getter for property routeTime
     * @return The number of seconds from the start of the route.
     */
    public long getRouteTime() {
        return routeTime;
    }

    /**
     * Setter for property routeTime
     * @param routeTime The number of seconds from the start of the route.
     */
    public void setRouteTime(long routeTime) {
        this.routeTime = routeTime;
    }
    
    /**
     * Getter for property latitude.
     * @return Value of property latitude.
     */
    public float getLatitude() {
        return latitude;
    }
    
    /**
     * Setter for property latitude.
     * @param latitude New value of property latitude.
     */
    public void setLatitude(float latitude) {
        this.latitude = latitude;
    }
    
    /**
     * Getter for property longitude.
     * @return Value of property longitude.
     */
    public float getLongitude() {
        return longitude;
    }
    
    /**
     * Setter for property longitude.
     * @param longitude New value of property longitude.
     */
    public void setLongitude(float longitude) {
        this.longitude = longitude;
    }
    
    /**
     * Getter for property elevation.
     * @return Value of property elevation.
     */
    public float getElevation() {
        return elevation;
    }
    
    /**
     * Setter for property elevation.
     * @param elevation New value of property elevation.
     */
    public void setElevation(float elevation) {
        this.elevation = elevation;
    }
    
    /**
     * Getter for property timestamp.
     * @return Value of property timestamp.
     */
    public java.util.Date getTimestamp() {
        return timestamp;
    }

    /**
     * Setter for property timestamp.
     * @param timestamp New value of property timestamp.
     */
    public void setTimestamp(java.util.Date timestamp) {
        this.timestamp = timestamp;
    }
    
    public int compareTo(Object o) {
        return timestamp.compareTo(((GpsLocation)o).timestamp);
    }


    /** 
     * Computes the distance in meters between this point and the given
     * point.
     */
    public double getMetersTo(GpsLocation b)
    {
        double lat1 = this.latitude;
        double lon1 = this.longitude;
        double lat2 = b.getLatitude();
        double lon2 = b.getLongitude();
        
        double R = EARTH_RADIUS_KM * 1000d;
        double dLat = Math.toRadians(lat1 - lat2);
        double dLon = Math.toRadians(lon1 - lon2);
        double n = Math.sin(dLat/2) * Math.sin(dLat/2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(n), Math.sqrt(1-n));
        double d = R * c;

        return d;
    }
    
    public double getMetersToElevation(GpsLocation b)
    {
        double h = getMetersTo(b);
        double v = Math.abs(elevation - b.elevation);
        
        double d = Math.sqrt((h*h) + (v*v));
        return d;
    }
    
    /**
     * Returns a bearing in radians.
     * @param b
     * @return radians
     */
    public double getBearingTo(GpsLocation b)
    {
        double lat1 = this.latitude;
        double lon1 = this.longitude;
        double lat2 = b.latitude;
        double lon2 = b.longitude;
        
        /* var y = Math.sin(dLon) * Math.cos(lat2);
         * var x = Math.cos(lat1)*Math.sin(lat2) -
         * Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
         * var brng = Math.atan2(y, x).toBrng();
         */
        double y = Math.sin(lon1 - lon2) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2);
        double radBrng = Math.atan2(y, x);
        return radBrng;
    }
    
    public boolean equals(Object o) {
        GpsLocation loc = (GpsLocation)o;
        return loc.latitude == this.latitude
            && loc.longitude == this.longitude
            && loc.elevation == this.elevation
            && loc.timestamp.equals(this.timestamp);
    }
    
    public int hashCode() {
    	return toString().hashCode();
    }
    
    
    
    public String toString() {
    	return "GpsLocation[" + getLatitude() + ", " + getLongitude() + "]";
    }
    
}
