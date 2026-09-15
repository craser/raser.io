package net.kukido.blog.tags;

import java.io.IOException;
import java.text.DecimalFormat;
import java.text.MessageFormat;

import javax.servlet.jsp.JspException;

import net.kukido.blog.config.DmgConfig;
import net.kukido.blog.dataaccess.AttachmentDao;
import net.kukido.blog.dataaccess.DataAccessException;
import net.kukido.blog.dataaccess.LocationMaskDao;
import net.kukido.blog.datamodel.Attachment;
import net.kukido.blog.datamodel.LocationMask;
import net.kukido.blog.log.Logging;
import net.kukido.maps.GpsLocation;
import net.kukido.maps.GpsTrack;
import net.kukido.maps.GpxParser;

import org.apache.log4j.Logger;
import org.apache.struts.taglib.html.ImgTag;
import org.xml.sax.SAXException;

/**
 * Takes a GpxTrack object (via the "map" attribute), and creates an HTML 
 * "img" tag pointing to a static image of the given route generated via 
 * the Google Static Maps API
 * 
 * See: https://developers.google.com/maps/documentation/staticmaps/
 * 
 * @author craser
 */
public class MapImage extends ImgTag
{
    // Required parameters:
    //     path
    static private final String URL_FORMAT = "//maps.googleapis.com/maps/api/staticmap?size={0}&sensor={1}&maptype={2}&format={3}&key={4}&path=color:0xFF0000BF|weight:3|{5}";
    static private final String API_KEY = new DmgConfig().getProperty("google.api.key");
    static private final DecimalFormat DEGREE_FORMAT = new DecimalFormat("#.####");
    
    static public String PAGE = "page";
    static public String REQUEST = "request";
    static public String SESSION = "session";
    static public String APPLICATION = "application";
    static public String DEFAULT_FORMAT = "jpg";
    static public String DEFAULT_SIZE = "postcard";
    static public String DEFAULT_MAPTYPE = "terrain";
    
    private Logger log = Logging.getLogger(getClass());
    private String size = DEFAULT_SIZE; // thumbnail, postcard, raw
    private String format = DEFAULT_FORMAT;
    private String mapAttachment;
    private boolean sensor = false; // Are we using a sensor (GPS, wifi, etc) to determine user's locatio?  HELL NO.
    private String mapType = DEFAULT_MAPTYPE;

    public void setSize(String size)
    {
        this.size = size;
    }

    public int doStartTag() throws JspException
    {
        setSrc();
        return super.doStartTag();
    }
    
    protected void setSrc()
    {
        try {
            String path = getPathValue();
            //"//maps.googleapis.com/maps/api/staticmap?size={0}&sensor={1}&maptype={2}&format={3}&key={4}&path=color:0xFF0000BF|weight:2|{5}";
            String src = MessageFormat.format(URL_FORMAT, getDimensions(), Boolean.toString(sensor), mapType, format, API_KEY, path);
            src = src.replaceAll("&", "&amp;"); // Encode the ampersands, hack hack hack.
            log.debug("URL for map thumbail for " + mapAttachment + ": " + src);
            setSrc(src); // super.
        }
        catch (Exception ignored) {
            ignored.printStackTrace(System.out);
        }
    }
    
    /**
     * Translates my thumbnail/postcard specifiers into actual pixel dims (ex 400x300)
     * Note that changing these values does NOT affect the size of thumbnail/postcard images elsewhere.
     * That's controlled in web.xml.
     * @param size
     * @return
     */
    protected String getDimensions()
    {
        if ("postcard".equalsIgnoreCase(size)) {
            return "630x290";
        }
        else if ("thumbnail".equalsIgnoreCase(size)) {
            return "20x20";
        }
        else {
            throw new IllegalStateException("Unrecognized size specifier: " + size);
        }
    }
    
    /**
     * Creates the path parameter for the image src.
     * ex. path=path=color:0xff0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397
     * 
     * I'm not using the color or weight parameters yet, but they are noted here in case I decide to do something with them.
     * 
     * WARNING: URLs must not be longer than 2048 characters.  The "getThinnedTrack()" method may be helpful here.  For now,
     * I'll fall back to the thinned track IFF the value string ends up longer than 1800 characters.  (This should leave 248 characters
     * for other parameters, which *should* be plenty, right?)
     * 
     * (https://developers.google.com/maps/documentation/staticmaps/#Paths)
     * @return
     */
    protected String getPathValue() throws DataAccessException, IOException, SAXException 
    {
        AttachmentDao dao = new AttachmentDao();
        LocationMaskDao maskDao = new LocationMaskDao();
        Attachment attachment = getAttachment();
        dao.populateBytes(attachment);
        GpxParser parser = new GpxParser();
        GpsTrack track = parser.parse(attachment.getBytes()).get(0); // FIXME: Just uses the first track in a GPX file.
        LocationMask mask = maskDao.findByUserId(attachment.getUserId());
        track = mask.mask(track);
        
        GpsTrack thinnedTrack = track.getThinnedTrack(85, 0);
        String pathValue = toPathValue(thinnedTrack);
        
        return pathValue;
    }
    
    protected String toPathValue(GpsTrack track) 
    {
        StringBuffer value = new StringBuffer();
        for (GpsLocation loc : track) {
            String lat = DEGREE_FORMAT.format(loc.getLatitude());
            String lon = DEGREE_FORMAT.format(loc.getLongitude());
            value.append(lat).append(",").append(lon).append("|"); // Don't forget to strip off the last | at the end.
        }
        return value.substring(0, value.length() - 1); // Leave off the last |
    }
    
    protected String truncate(float f, int d)
    {
        String s = Float.toString(f);
        int l = s.indexOf('.') + 4;
        if (s.length() > l) {
        }
        return s;
    }
    
    protected Attachment getAttachment() throws DataAccessException
    {
        AttachmentDao dao = new AttachmentDao();
        Attachment attachment = dao.findByFileName(mapAttachment);
        return attachment;
    }

    public String getSize()
    {
        return size;
    }

    public void setMap(String mapAttachment)
    {
        this.mapAttachment = mapAttachment;
    }
    
    /**
     * terrain, roadmap, satellite hybrid 
     * @param mapType
     */
    public void setMapType(String mapType)
    {
        this.mapType = mapType;
    }
    
    public void setSensor(Boolean sensor) 
    {
        this.sensor = sensor;
    }
    
    /**
     * Sets format for image (jpg, gif, etc.)
     * @param format
     */
    public void setFormat(String format) 
    {
        this.format = format;
    }

}
