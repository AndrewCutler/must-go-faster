# Parser
Takes a file with a collection of PGNs in it and splits them into separate files.

### Flags
1. ***src***: The .pgn file to convert. Each PGN in the file is saved to a separate file with the filename {GUID}.pgn.
2. ***dest*** (optional): The output directory; default is "pgns".