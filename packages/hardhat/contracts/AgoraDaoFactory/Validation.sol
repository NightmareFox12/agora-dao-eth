// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

abstract contract Validation {
    function _createDao(
        string memory _name,
        string memory _description,
        uint256 _categoryID,
        string[] memory _daoCategories
    ) internal virtual {
        //TODO: me falta verificar que el nombre no este repetido. Pero gastaria mucho gas

        require(bytes(_name).length > 0, "Dao name must not be empty");
        require(bytes(_name).length <= 60, "The name of the DAO is very long");
        require(bytes(_description).length > 0, "DAO description must not be empty");
        require(bytes(_description).length <= 500, "The description of the DAO is very long");

        require(_categoryID < _daoCategories.length, "Invalid category ID.");
    }
}
