import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

export function SearchableSelect({ options, onSelect, placeholder, required, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    setFilteredOptions(
      options.filter((option) =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, options]);

    useEffect(() => {
    if (value) {
      setSearchTerm(value);
    }
  }, [value]);

  const handleSelect = (option) => {
    onSelect(option);
    setSearchTerm(option.name);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        required={required}
        className="w-full"
      />
      {isOpen && (
        <div className="absolute z-10 max-w-[250px] mt-1 bg-background border border-input rounded-md shadow-lg">
          <ScrollArea className="h-[200px]">
            <div className="py-1">
              {filteredOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="ghost"
                  className="w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelect(option)}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
