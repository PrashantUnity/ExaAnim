#!/usr/bin/env dotnet run
// Scans index.html lessons, reads titles/descriptions from each file, writes site-index.json.
// CI runs this before deploy. Local preview: dotnet run GenerateSiteIndex.cs
// JSON has no basePath, href, or timestamps — the browser resolves relative links.

#:sdk Microsoft.NET.Sdk
#:property TargetFramework=net10.0
#:property PublishAot=false

using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

var repoRoot = FindRepoRoot();
var pages = ScanPages(repoRoot);
pages.Sort((a, b) => string.Compare(a.Path, b.Path, StringComparison.OrdinalIgnoreCase));

var rootIndexPath = Path.Combine(repoRoot, "index.html");
var siteTitle = File.Exists(rootIndexPath)
    ? ExtractTitle(File.ReadAllText(rootIndexPath)) ?? "ExaAnim"
    : "ExaAnim";

var index = new SiteIndex
{
    Title = siteTitle,
    Pages = pages.Select(p => new PageEntry
    {
        Path = p.Path,
        Title = p.Title,
        Description = p.Description
    }).ToList()
};

var outPath = Path.Combine(repoRoot, "site-index.json");
var json = JsonSerializer.Serialize(index, new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
});
File.WriteAllText(outPath, json);
Console.WriteLine($"Wrote {outPath} ({pages.Count} page(s))");

static string FindRepoRoot()
{
    var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (dir is not null)
    {
        if (Directory.Exists(Path.Combine(dir.FullName, ".git")))
            return dir.FullName;
        dir = dir.Parent;
    }
    throw new InvalidOperationException("Repository root (.git) not found. Run from the ExaAnim repo directory.");
}

static List<ScannedPage> ScanPages(string repoRoot)
{
    var skip = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        { ".git", ".github", "node_modules" };
    var pages = new List<ScannedPage>();
    ScanDir(repoRoot, repoRoot, skip, pages);
    return pages;
}

static void ScanDir(string repoRoot, string dir, HashSet<string> skip, List<ScannedPage> pages)
{
    var isRoot = Path.GetFullPath(dir) == Path.GetFullPath(repoRoot);
    var indexPath = Path.Combine(dir, "index.html");

    if (File.Exists(indexPath) && !isRoot)
    {
        var rel = Path.GetRelativePath(repoRoot, dir).Replace('\\', '/');
        var html = File.ReadAllText(indexPath);
        var folderName = Path.GetFileName(dir) ?? rel;

        pages.Add(new ScannedPage
        {
            Path = rel,
            Title = ExtractTitle(html) ?? HumanizeFolderName(folderName),
            Description = ExtractDescription(html) ?? ExtractFirstHeading(html)
        });
    }

    foreach (var sub in Directory.GetDirectories(dir))
    {
        var name = Path.GetFileName(sub);
        if (name is null || name.StartsWith('.') || skip.Contains(name))
            continue;
        ScanDir(repoRoot, sub, skip, pages);
    }
}

static string? ExtractTitle(string html)
{
    var m = Regex.Match(html, @"<title[^>]*>\s*([^<]+?)\s*</title>", RegexOptions.IgnoreCase);
    return m.Success ? DecodeHtml(m.Groups[1].Value.Trim()) : null;
}

static string? ExtractDescription(string html)
{
    var m = Regex.Match(html,
        @"<meta[^>]+name=[""']description[""'][^>]+content=[""']([^""']+)[""']",
        RegexOptions.IgnoreCase);
    if (!m.Success)
    {
        m = Regex.Match(html,
            @"<meta[^>]+content=[""']([^""']+)[""'][^>]+name=[""']description[""']",
            RegexOptions.IgnoreCase);
    }
    return m.Success ? DecodeHtml(m.Groups[1].Value.Trim()) : null;
}

static string? ExtractFirstHeading(string html)
{
    var m = Regex.Match(html, @"<h2[^>]*>\s*([^<]+?)\s*</h2>", RegexOptions.IgnoreCase);
    return m.Success ? DecodeHtml(m.Groups[1].Value.Trim()) : null;
}

static string HumanizeFolderName(string name) =>
    string.Join(' ', Regex.Split(name, @"(?<!^)(?=[A-Z])")).Trim();

static string DecodeHtml(string text) =>
    text.Replace("&amp;", "&").Replace("&lt;", "<").Replace("&gt;", ">")
        .Replace("&quot;", "\"").Replace("&#39;", "'");

sealed class SiteIndex
{
    public string Title { get; set; } = "";
    public List<PageEntry> Pages { get; set; } = [];
}

sealed class PageEntry
{
    public string Path { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
}

sealed class ScannedPage
{
    public string Path { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
}
