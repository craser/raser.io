public class MapImage {
    private final String fileName;
    
    public MapImage(String fileName) {
        this.fileName = fileName;
    }
    
    public String getImagePath() {
        return "/images/maps/" + fileName;
    }
}
