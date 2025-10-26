# MCP JSON Navigator

A Model Context Protocol (MCP) server that provides intelligent JSON navigation and search capabilities for AI assistants.
Mostly design for saving tokens and manipulating large files > 10MB in a few seconds.

Require [FileSystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem).
*Note the json should note use "." in keys*


> Capabilities
> 1. "Search keys & values ("phone", "email", "location")"
> 2. "Precise path lookup with optional case-sensitive matching"
> 3. "Structural exploration of very large JSON files
> (without loading everything into model context)"

--- 
## 📦 Installation

```bash
git clone https://github.com/Adsdworld/mcp-json-navigator && npm install && npm run build
```

## ⚙️ Configuration

Add to your MCP settings file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "json-navigator": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\mcp-json-navigator\\build\\index.js"]
    }
  }
}
```

Replace `YOUR_USERNAME` and the path with your actual installation location.
---

## 🔎 Json-query
```json
{ 
  "Request": {
    "limit": 50,
    "query": "phone",
    "filepath": "C:\\Shared\\With\\Claude\\data.json",
    "caseSensitive": false
  },
  "Response": {
  "results": [
    {
      "path": "result[0]",
      "score": 2
    },
    {
      "path": "result[1]",
      "score": 2
    }
  ]
}
}
```

## 🛤️ Json-explore

```json
{
  "Request": {
    "filepath": "C:\\Shared\\With\\Claude\\data.json",
    "jsonpath": "result[1]",
    "verbosity": 5
  },
  "Response": {
    "message": "Hello, Brannon! Your order number is: #100",
    "phoneNumber": "(268) 822-7569",
    "phoneVariation": "+90 343 871 10 66",
    "status": "disabled",
    "name": "{object: 3 keys, 49 chars}",
    "username": "Madalyn-Koss",
    "password": "_jRAnwKTcLZwdj6",
    "emails": "[list: 2 items, 54 chars]",
    "location": "{object: 6 keys, 175 chars}",
    "website": "https://sour-debris.com/",
    "domain": "wrong-leaf.org",
    "job": "{object: 5 keys, 123 chars}",
    "creditCard": "{object: 3 keys, 60 chars}",
    "uuid": "476c7b47-0c28-4dc1-b872-7c4256a95675",
    "objectId": "68fe628328b168737793b750"
  }
}
```

--- 


## 🎯 Who is this for?

**This tool is designed for AI assistants that need to navigate and search through large JSON files efficiently.**

When dealing with massive JSON structures (hundreds of MB, deeply nested objects, thousands of entries), AI models face several challenges:
- **Token limitations**: Large JSON files can't fit entirely in the context window
- **Performance**: Parsing and searching large structures is slow
- **Precision**: Finding specific data in complex nested structures is difficult

**MCP JSON Navigator solves these problems by:**
- Providing intelligent exploration with adjustable verbosity levels
- Using fuzzy search with camelCase tokenization for natural queries
- Allowing precise navigation using JSON paths
- Grouping and scoring results intelligently

## ✨ Features

### 1. **Smart JSON Exploration** (`json-explore`)
Navigate through JSON structures with adjustable detail levels:

```typescript
// Get an overview (verbosity: 0-1)
{ "users": "list", "config": "object", "version": "string" }

// See structure with counts (verbosity: 2-3)
{ "users": "[list: 150 items]", "config": "{object: 12 keys, 450 chars}" }

// Full expansion for small objects (verbosity: 4-5)
{ "users": [...], "config": {...} }
```

**Parameters:**
- `filepath`: Path to the JSON file
- `jsonpath` (optional): Navigate to specific path (e.g., `users[0].profile`)
- `verbosity`: 0-5 (default: 4)
    - `0`: Keys only
    - `1`: Keys with types
    - `2`: Keys with counts
    - `3`: Keys with counts and character sizes
    - `4`: Smart expansion for small objects
    - `5`: Raw data
- `listDisplayLimit`: Max items to show in arrays (default: 5)
- `objectDisplayLimit`: Max keys to show in objects (default: 6)
- `charDisplayLimit`: Max characters for expansion (default: 200)

### 2. **Intelligent Search** (`json-query`)
Search through keys and values with fuzzy matching and camelCase tokenization:

```typescript
// These all find "phoneNumber" and "phoneVariation"
query: "phone"     ✓
query: "number"    ✓
query: "variation" ✓
```

**How it works:**
1. **Tokenization**: Splits camelCase, snake_case, kebab-case, and generates n-grams
2. **Fuzzy Matching**: Uses similarity scoring to find partial matches
3. **Weighted Scoring**: Keys score higher than values
4. **Smart Grouping**: Groups related results from the same JSON branch

**Parameters:**
- `filepath`: Path to the JSON file
- `query`: Search term (supports partial matches)
- `limit`: Max results to return (default: 20, min: 10)
- `caseSensitive`: Enable exact matching filter (default: false)

When `caseSensitive: true`, returns an additional `exactMatch` field with results that contain the exact query string.


## 🚀 Usage Examples

### Example 1: Exploring a Large JSON File

```typescript
// First, get an overview
json-explore({
  filepath: "C:\\Shared\\With\\Claude\\data.json",
  verbosity: 1
})
// → { "users": "list", "products": "list", "config": "object" }

// Then navigate to a specific section
json-explore({
  filepath: "C:\\Shared\\With\\Claude\\data.json",
  jsonpath: "users[0]",
  verbosity: 5
})
// → Full details of the first user
```

### Example 2: Searching for Contacts

```typescript
// Find all phone-related fields by high scores paths
json-query({
  filepath: "C:\\Shared\\With\\Claude\\contacts.json",
  query: "phone",
  limit: 20
})
// → Results with paths like "contacts[0].phoneNumber", "contacts[1].phoneVariation"

// Returning a list of exact paths found that exactly match + high scores paths
json-query({
  filepath: "C:\\Shared\\With\\Claude\\contacts.json",
  query: "qsbHBJ5sd4HBSDsdjhHBS",
  caseSensitive: true
})
```

### Example 3: Complex Navigation

```typescript
// Navigate deep into nested structures
json-explore({
  filepath: "api-response.json",
  jsonpath: "result.data.items[3].metadata",
  verbosity: 3
})
// → Full details metadata either an object / list / primitif
```

## 🛠️ Technical Details

### Architecture

- **TypeScript-based**: Fully typed for reliability
- **MCP Protocol**: Built on Model Context Protocol standard
- **Fast Fuzzy Search**: Uses `fast-fuzzy` library for efficient matching
- **Inverted Index**: Builds searchable index with n-gram tokenization
- **Smart Grouping**: Groups results by JSON structure for better relevance

### Search Algorithm

1. **Tokenization**:
    - Normalizes text (camelCase → camel Case)
    - Generates 3-5 character n-grams
    - Builds inverted index: token → [paths with weights]

2. **Query Phase**:
    - Tokenizes query
    - Computes fuzzy similarity scores
    - Accumulates scores per path
    - Applies key/value weights

3. **Result Grouping**:
    - Groups paths by structural similarity
    - Scores by frequency × depth
    - Returns top representative paths

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

**You are free to:**
- ✓ Use commercially
- ✓ Modify
- ✓ Distribute
- ✓ Use privately

**Just mention the source:** https://github.com/Adsdworld/mcp-json-navigator

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📚 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)

## 🔗 Links

- **GitHub**: https://github.com/Adsdworld/mcp-json-navigator
- **MCP Documentation**: https://modelcontextprotocol.io/

---

Built with ❤️ for AI assistants navigating complex JSON structures.
