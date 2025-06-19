// Test if class-validator works with the post DTO structure
require("reflect-metadata");
const { IsString, IsNotEmpty, MaxLength } = require("class-validator");

console.log("IsString:", typeof IsString);
console.log("IsNotEmpty:", typeof IsNotEmpty);
console.log("MaxLength:", typeof MaxLength);

class TestDTO {
  content;
}

// Apply decorators manually
IsString()(TestDTO.prototype, "content");
IsNotEmpty()(TestDTO.prototype, "content");
MaxLength(240)(TestDTO.prototype, "content");

console.log("Test passed - decorators applied successfully");
