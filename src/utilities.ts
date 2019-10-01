



function hashCode(obj: string): number{
    //https://stackoverflow.com/a/8076436/3067894
    var hash = 0;
    for (var i = 0; i < obj.length; i++) {
        var character = obj.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}