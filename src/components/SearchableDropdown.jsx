import React, { useState, useRef, useEffect } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Check } from "lucide-react";

export function SearchableDropdown({ options, onSelect, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
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

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    setSelectedOption(option);
    setSearchTerm(option.name);
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        {selectedOption ? selectedOption.name : placeholder}
        <span className="ml-2">▼</span>
      </Button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2">
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <ScrollArea className="h-[200px]">
            {filteredOptions.map((option) => (
              <Button
                key={option.id}
                className="w-full justify-between text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => handleSelect(option)}
              >
                {option.name}
                {selectedOption && selectedOption.id === option.id && (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}