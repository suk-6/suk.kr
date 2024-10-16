type CreateItemInputProps = {
	value: string;
	setValue: (value: string) => void;
	placeholder: string;
};

export const CreateItemInput = ({
	value,
	setValue,
	placeholder,
}: CreateItemInputProps) => {
	return (
		<input
			type="text"
			className="w-full h-full outline-none bg-gray-100"
			placeholder={placeholder}
			value={value}
			onChange={(e) => setValue(e.target.value)}
		/>
	);
};
