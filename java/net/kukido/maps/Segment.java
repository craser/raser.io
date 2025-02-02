package net.kukido.maps;

import java.util.ArrayList;
import java.util.List;

public class Segment implements Comparable<Segment>
{
    private final List<GpsLocation> track;
    private final int start;
    private final int end;
    private final double interest;
    private final int index;
    
    public Segment(List<GpsLocation> track, int start, int end) {
        this.track = track;
        this.start = start;
        this.end = end;

        double maxDistance = 0d;
        int maxIndex = 0;
        
        GpsLocation a = track.get(start);
        double bearing = a.getBearingTo(track.get(end));
        for (int i = start + 1; i < end; i++) {
            GpsLocation p = track.get(i);
            double dp = a.getMetersTo(p);
            double bp = a.getBearingTo(p);
            double distance = getDistanceToLine(bearing, bp, dp);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        this.interest = maxDistance;
        this.index = maxIndex;
    }
    
    public GpsLocation getStart() {
        return track.get(start);
    }
    
    public GpsLocation getEnd() {
        return track.get(end);
    }
    
    public double getInterest() {
        return interest;
    }
    
    public List<Segment> split() {
        List<Segment> segments = new ArrayList<Segment>(2);
        segments.add(new Segment(track, start, index));
        segments.add(new Segment(track, index, end));
        
        return segments;
    }
    
    private double getDistanceToLine(double bl, double bp, double dp)
    {
        double p = Math.abs(bp - bl) % Math.PI;
        double t = (p > (0.5d * Math.PI)) ? (Math.PI - p) : p;
        double d = dp * Math.sin(t);
        
        return d;
    }
    
    public String toString() {
        return "Seg[" + start + "-" + end + ": " + interest + "]";
    }

    /**
     * Compares two segments based on how "interesting" they are.
     */
	public int compareTo(Segment segment) {
		if (this.interest > segment.getInterest()) {
			return 1;
		}
		else if (this.interest < segment.getInterest()) {
			return -1;
		}
		else {
			return 0;
		}
	}
}
