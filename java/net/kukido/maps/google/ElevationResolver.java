package net.kukido.maps.google;

import net.kukido.blog.log.Logging;
import net.kukido.maps.GpsLocation;
import net.kukido.maps.GpsTrack;
import org.apache.log4j.Logger;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;

/**
 * Takes a GpsTrack and calls out to Google's elevation service
 * to correct elevation data.  (Satellite data used by GPS units
 * has intentionally-induced chatter in elevation.)
 * @author craser
 *
 */
public class ElevationResolver 
{
	static private final int MAX_URL_LENGTH = 1000; // De-facto limit of 2048 chars.
	static private final int MAX_POINTS_PER_REQUEST = 512;
	
	private Logger log;
	
	public ElevationResolver() {
		this.log = Logging.getLogger(this.getClass());
	}
	
	public GpsTrack resolve(GpsTrack track) throws IOException, SAXException
	{
		log.debug("Resolving track...");
		int start = 0;
		ElevationResponseParser parser = new ElevationResponseParser();
		List<URL> urls = buildUrls(track);
		for (URL url : urls) {
			log.debug("    Resolving section...");
			log.debug("    start: " + start);
			log.debug("    url  : " + url);
			URLConnection conn = url.openConnection();
			InputStream in = conn.getInputStream();
			ElevationResponse response = parser.parse(in);
			response.fixElevations(track, start);
			start += response.getLocations().size();
		}
		log.debug("...done resolving track.");
		return track;
	}
	
	/**
	 * max points: 512
	 * max url length: 2048
	 * 
	 * @param track
	 * @return
	 * @throws MalformedURLException
	 */
	private List<URL> buildUrls(GpsTrack track) throws MalformedURLException
	{
		log.debug("buildUrls()");
		List<URL> urls = new ArrayList<URL>();
		int count = 0;
		StringBuffer url = getUrl();
		for (GpsLocation loc : track) {
			count++;
			url.append(loc.getLatitude());
			url.append(",");
			url.append(loc.getLongitude()).append("|"); // Don't forget to strip off the last one.
			if (url.length() > MAX_URL_LENGTH || count >= MAX_POINTS_PER_REQUEST) {
				log.debug("done building urls for track section. (count: " + count + ")");
				count = 0;
				urls.add(new URL(url.substring(0, url.length() - 1)));
				url = getUrl();
			}
		}
		log.debug("built " + urls.size() + "urls");
		return urls;
	}
	
	private StringBuffer getUrl() {
		StringBuffer url = new StringBuffer("http://maps.googleapis.com/maps/api/elevation/xml?");
		url.append("sensor=true");
		url.append("&locations=");
		
		return url;
	}

}
