// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import "./shared/IAgoraDao.sol";

/**
 * Soulbound NFT badges that members earn from the reputation module. One badge per level reached, and they
 * stay forever with the wallet that earned them: a transfer always reverts.
 *
 * The image is generated on-chain (an SVG embedded in a data URI), so no server is needed to serve metadata.
 *
 * Every DAO has its own copy of this contract (a clone created by the factory).
 *
 * @title AgoraRewards
 * @author NightmareFox12
 */
contract AgoraRewards is ERC721 {
    IAgoraDao public dao;
    /// @notice Only this address (the reputation module) can mint badges.
    address public reputation;
    bool private initialized;

    uint256 private nextTokenId;
    mapping(uint256 => uint8) private _levelOf;

    event BadgeMinted(address indexed user, uint8 indexed level, uint256 tokenId);

    /// @dev The implementation's name and symbol are empty; the clones use the overrides below.
    constructor() ERC721("", "") {
        initialized = true;
    }

    function initialize(address _dao, address _reputation) external {
        require(!initialized, "Already initialized");
        require(_dao != address(0) && _reputation != address(0), "Invalid address");

        initialized = true;
        dao = IAgoraDao(_dao);
        reputation = _reputation;
    }

    // --- READ FUNCTIONS ---

    /// @notice Overrides ERC721.name so clones (which skip the constructor) still have one.
    function name() public pure override returns (string memory) {
        return "Agora Reputation Badge";
    }

    function symbol() public pure override returns (string memory) {
        return "AGORA-BADGE";
    }

    /// @notice The level this badge represents.
    function levelOf(uint256 _tokenId) external view returns (uint8) {
        _requireOwned(_tokenId);
        return _levelOf[_tokenId];
    }

    function totalMinted() external view returns (uint256) {
        return nextTokenId;
    }

    /// @notice Metadata URI with an inline SVG, so no server is needed to serve the image.
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireOwned(_tokenId);
        uint8 level = _levelOf[_tokenId];

        string memory svg = _buildSvg(level);
        string memory json = string.concat(
            '{"name":"Insignia Agora - Nivel ',
            Strings.toString(level),
            '","description":"Insignia soulbound de reputacion. Prueba de haber alcanzado el nivel ',
            Strings.toString(level),
            ' en esta DAO.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '"}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    // --- WRITE FUNCTIONS ---

    /// @notice Called by the reputation module when a user reaches a new level.
    function mint(address _to, uint8 _level) external returns (uint256 tokenId) {
        require(msg.sender == reputation, "Only the reputation module can mint");
        require(_to != address(0), "Invalid recipient");
        require(_level >= 1, "Invalid level");

        tokenId = ++nextTokenId;
        _levelOf[tokenId] = _level;
        // `_mint` instead of `_safeMint`: no callback into the recipient, no reentrancy surface.
        _mint(_to, tokenId);

        emit BadgeMinted(_to, _level, tokenId);
    }

    // --- INTERNAL ---

    /// @dev Soulbound: a token can only be minted (from == 0) or burned (to == 0), never transferred.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert("Reputation badges are soulbound");
        return super._update(to, tokenId, auth);
    }

    function _buildSvg(uint8 _level) private pure returns (string memory) {
        // One color per level, from bronze to legendary gold
        string[6] memory colors = [
            "#b45309", // Lv 1 bronze
            "#64748b", // Lv 2 silver
            "#eab308", // Lv 3 gold
            "#0ea5e9", // Lv 4 sky
            "#9333ea", // Lv 5 violet
            "#dc2626" // Lv 6 red
        ];
        string memory color = _level >= 1 && _level <= 6 ? colors[_level - 1] : "#334155";

        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                '<defs><radialGradient id="g" cx="50%" cy="35%" r="70%">',
                '<stop offset="0%" stop-color="',
                color,
                '"/><stop offset="100%" stop-color="#0f172a"/></radialGradient></defs>',
                '<rect width="400" height="400" fill="url(#g)"/>',
                '<circle cx="200" cy="200" r="140" fill="none" stroke="',
                color,
                '" stroke-width="6" opacity="0.9"/>',
                '<text x="200" y="150" font-size="26" fill="#fff" text-anchor="middle" font-family="sans-serif" opacity="0.85">Agora DAO</text>',
                '<text x="200" y="240" font-size="110" fill="#fff" text-anchor="middle" font-family="sans-serif" font-weight="700">',
                Strings.toString(_level),
                "</text>",
                '<text x="200" y="300" font-size="22" fill="#fff" text-anchor="middle" font-family="sans-serif" opacity="0.75">Nivel</text>',
                "</svg>"
            );
    }
}
