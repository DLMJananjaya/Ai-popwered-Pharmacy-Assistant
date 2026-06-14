import React, { use } from 'react'

// 1. Define the expected shape of your props
interface PageProps {
  params: Promise<{ alwaysShow: string[] }>;
}

// 2. Apply the interface to the component
function page({ params }: PageProps) {
  const unwrappedParams = use(params);

  return (
    <>
    <div className="text-black">
      <h1 className="text-center">Please check Your URL</h1>
      
      
      <ul>
        {/* 3. Added optional chaining (?.) and the map index */}
        {unwrappedParams?.alwaysShow?.map((item, index) => {
          return ( 
            // 4. Added the required unique key prop
            <li key={`${item}-${index}`}>
              {item}
            </li>
          )
        })}
      </ul>
      </div>
    </>
  )
}

export default page;