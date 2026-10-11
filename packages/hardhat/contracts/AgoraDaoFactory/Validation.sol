// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

abstract contract Validation {
    uint256 public constant MAX_CATEGORIES = 3;

    function _createDao(
        string memory _name,
        string memory _description,
        uint256[] memory _categoryIDs,
        string[] memory _daoCategories
    ) internal virtual {
        //TODO: me falta verificar que el nombre no este repetido. Pero gastaria mucho gas

        require(bytes(_name).length > 0, "Dao name must not be empty");
        require(bytes(_name).length <= 50, "The name of the DAO is very long");
        require(bytes(_description).length > 0, "DAO description must not be empty");
        require(bytes(_description).length <= 500, "The description of the DAO is very long");

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
