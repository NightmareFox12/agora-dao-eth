// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

abstract contract Validation {
    // Keep in sync with packages/nextjs/lib/schemes/dao.scheme.ts
    uint256 public constant MAX_NAME_LENGTH = 50;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;
    uint256 public constant MAX_CATEGORIES = 3;

    /**
     * Key used to detect repeated DAO names. It is case-insensitive for ASCII letters, so
     * "ETH Force" and "eth force" are the same name. Checking a hash in a mapping costs the same
     * no matter how many DAOs exist (looping over all the names would not scale).
     * Note: lookalike unicode characters are not detected.
     */
    function _nameKey(string memory _name) internal pure returns (bytes32) {
        bytes memory original = bytes(_name);
        bytes memory lowered = new bytes(original.length);

        for (uint256 i = 0; i < original.length; i++) {
            bytes1 char = original[i];
            lowered[i] = (char >= 0x41 && char <= 0x5A) ? bytes1(uint8(char) + 32) : char;
        }

        return keccak256(lowered);
    }

    function _createDao(
        string memory _name,
        string memory _description,
        uint256[] memory _categoryIDs,
        string[] memory _daoCategories
    ) internal virtual {
        require(bytes(_name).length > 0, "Dao name must not be empty");
        require(bytes(_name).length <= MAX_NAME_LENGTH, "The name of the DAO is very long");
        require(
            bytes(_name)[0] != 0x20 && bytes(_name)[bytes(_name).length - 1] != 0x20,
            "The name must not start or end with spaces"
        );
        require(bytes(_description).length > 0, "DAO description must not be empty");
        require(bytes(_description).length <= MAX_DESCRIPTION_LENGTH, "The description of the DAO is very long");

        require(_categoryIDs.length > 0, "At least one category is required");
        require(_categoryIDs.length <= MAX_CATEGORIES, "Too many categories");

        for (uint256 i = 0; i < _categoryIDs.length; i++) {
            require(_categoryIDs[i] < _daoCategories.length, "Invalid category ID.");

            for (uint256 j = 0; j < i; j++) {
                require(_categoryIDs[i] != _categoryIDs[j], "Duplicate category");
            }
        }
    }
}
